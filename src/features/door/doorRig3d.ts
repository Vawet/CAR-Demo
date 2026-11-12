import { Box3, MathUtils, Quaternion, Vector3, type Object3D } from 'three'
import type { CarProfile, DoorPartConfig } from '../../car/carProfiles'
import { makeHighlightable } from '../../car/highlight'
import { findNode, tagPart, type CarRig } from '../../car/partTag'
import { easeInOut } from '../../core/animated'
import { useCarStore } from '../../core/store'
import { DOOR_IDS, type DoorId } from './doorTypes'

const X = new Vector3(1, 0, 0)
const Y = new Vector3(0, 1, 0)
const Z = new Vector3(0, 0, 1)

/** 蝴蝶门：先绕横轴抬起，再绕纵轴向外翻 */
const BUTTERFLY_LIFT_DEG = 62
const BUTTERFLY_ROLL_DEG = 18
const SWING_DEG = 62

/** 绕世界坐标系中的铰链点旋转车门节点；车模需已归一化（车头 +Z，左侧 +X） */
class DoorHinge {
  private readonly pivot = new Vector3()
  private readonly basePosition: Vector3
  private readonly parentQuat = new Quaternion()
  private readonly baseQuat: Quaternion
  private readonly openRotation: Quaternion
  private readonly tmpQ = new Quaternion()
  private readonly tmpV = new Vector3()

  constructor(
    private readonly node: Object3D,
    style: DoorPartConfig['style'],
    isLeft: boolean,
  ) {
    const parent = node.parent!
    const box = new Box3().setFromObject(node)
    this.basePosition = node.getWorldPosition(new Vector3())
    parent.getWorldQuaternion(this.parentQuat)
    this.baseQuat = node.quaternion.clone()
    const side = isLeft ? 1 : -1

    if (style === 'butterfly') {
      this.pivot.set(this.basePosition.x, box.max.y, box.max.z)
      const lift = new Quaternion().setFromAxisAngle(X, MathUtils.degToRad(BUTTERFLY_LIFT_DEG))
      const roll = new Quaternion().setFromAxisAngle(Z, MathUtils.degToRad(side * BUTTERFLY_ROLL_DEG))
      this.openRotation = roll.multiply(lift)
    } else {
      this.pivot.set(isLeft ? box.max.x : box.min.x, this.basePosition.y, box.max.z)
      this.openRotation = new Quaternion().setFromAxisAngle(Y, MathUtils.degToRad(-side * SWING_DEG))
    }
  }

  /** t：0 = 关闭，1 = 全开 */
  apply(t: number) {
    const rotation = this.tmpQ.identity().slerp(this.openRotation, t)

    const worldPos = this.tmpV.copy(this.basePosition).sub(this.pivot).applyQuaternion(rotation).add(this.pivot)
    this.node.position.copy(this.node.parent!.worldToLocal(worldPos))

    // local = parentWorld⁻¹ · R · parentWorld · base
    this.node.quaternion
      .copy(this.parentQuat)
      .invert()
      .multiply(rotation)
      .multiply(this.parentQuat)
      .multiply(this.baseQuat)
    // 车窗裁剪面依赖车门的世界矩阵，需立即更新
    this.node.updateMatrixWorld(true)
  }
}

/** 需在车窗绑定之后创建：车门高亮会跳过已经属于车窗的玻璃 */
export function createDoorRig(root: Object3D, profile: CarProfile): CarRig {
  const hinges = new Map<DoorId, DoorHinge>()
  const highlights = new Map<DoorId, (on: boolean) => void>()

  for (const id of DOOR_IDS) {
    const config = profile.doors[id]
    const node = config && findNode(root, config.node)
    if (!config || !node) {
      if (config) console.warn(`[DoorRig] ${id}: 未找到节点 ${config.node}`)
      continue
    }
    const tag = { domain: 'door' as const, id }
    tagPart(node, tag)
    highlights.set(id, makeHighlightable(node, tag))
    hinges.set(id, new DoorHinge(node, config.style, id === 'frontLeft' || id === 'rearLeft'))
  }

  const applied = new Map<DoorId, number>()
  return {
    mount: () => useCarStore.getState().setAvailableDoors([...hinges.keys()]),
    update: (state) =>
      hinges.forEach((hinge, id) => {
        const t = easeInOut(state.doors[id].position)
        if (applied.get(id) === t) return
        applied.set(id, t)
        hinge.apply(t)
      }),
    setHighlighted: (tag, on) => tag.domain === 'door' && highlights.get(tag.id as DoorId)?.(on),
  }
}
