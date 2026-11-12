import { Box3, MathUtils, Object3D, PointLight, SpotLight, Vector3, type Mesh, type MeshStandardMaterial } from 'three'
import type { CarProfile } from '../../car/carProfiles'
import { findNode, tagPart, type CarRig } from '../../car/partTag'
import { splitMeshLeftRight } from '../../car/splitMesh'
import type { CarState } from '../../core/store'
import { FLASH_PERIOD_MS } from './lightSlice'
import type { LightTarget } from './lightTypes'

const TURN_PERIOD_MS = 700

/** 一组发光部件：通过 emissiveIntensity 平滑开关 */
class Emitter {
  private readonly materials: MeshStandardMaterial[] = []
  private readonly baseIntensity: number[] = []
  private level = 0

  constructor(
    meshes: Mesh[],
    private readonly fadePerSecond = 14,
  ) {
    for (const mesh of meshes) {
      const material = (mesh.material as MeshStandardMaterial).clone()
      mesh.material = material
      this.materials.push(material)
      this.baseIntensity.push(Math.max(material.emissiveIntensity, 2))
      material.emissiveIntensity = 0
    }
  }

  get empty() {
    return this.materials.length === 0
  }

  /** 返回当前亮度 0~1，供附带的灯光对象使用 */
  update(on: boolean, dt: number) {
    this.level = MathUtils.damp(this.level, on ? 1 : 0, this.fadePerSecond, dt)
    this.materials.forEach((m, i) => (m.emissiveIntensity = this.baseIntensity[i] * this.level))
    return this.level
  }
}

function collectMeshes(root: Object3D, names: string[] = []) {
  const meshes: Mesh[] = []
  for (const name of names) {
    findNode(root, name)?.traverse((o) => {
      if ((o as Mesh).isMesh) meshes.push(o as Mesh)
    })
  }
  return meshes
}

function worldBox(meshes: Mesh[]) {
  const box = new Box3()
  meshes.forEach((m) => box.expandByObject(m))
  return box
}

/** 在世界坐标 position 处向 root 添加灯光（root 已归一化，处于场景原点） */
function addLight<T extends PointLight | SpotLight>(root: Object3D, light: T, position: Vector3) {
  light.position.copy(root.worldToLocal(position.clone()))
  light.intensity = 0
  root.add(light)
  return light
}

export function createLightRig(root: Object3D, profile: CarProfile): CarRig {
  root.updateMatrixWorld(true)
  const tag = (meshes: Mesh[], id: LightTarget) => meshes.forEach((m) => tagPart(m, { domain: 'light', id }))

  const headMeshes = collectMeshes(root, profile.lights.headlight)
  const tailMeshes = collectMeshes(root, profile.lights.taillight)
  tag(headMeshes, 'headlight')
  tag(tailMeshes, 'taillight')

  const leftTurn: Mesh[] = []
  const rightTurn: Mesh[] = []
  for (const mesh of collectMeshes(root, profile.lights.turnSignal)) {
    const { left, right } = splitMeshLeftRight(mesh)
    leftTurn.push(left)
    rightTurn.push(right)
  }
  tag(leftTurn, 'leftTurn')
  tag(rightTurn, 'rightTurn')

  const head = new Emitter(headMeshes)
  const tail = new Emitter(tailMeshes)
  const turnL = new Emitter(leftTurn, 40)
  const turnR = new Emitter(rightTurn, 40)

  // 大灯投射到地面的光束
  const beams: SpotLight[] = []
  if (!head.empty) {
    const box = worldBox(headMeshes)
    const y = (box.min.y + box.max.y) / 2
    for (const x of [box.min.x + 0.15, box.max.x - 0.15]) {
      const beam = addLight(root, new SpotLight('#eaf2ff', 0, 16, 0.6, 0.6, 1.4), new Vector3(x, y, box.max.z))
      const target = new Object3D()
      target.position.copy(root.worldToLocal(new Vector3(x * 1.3, 0, box.max.z + 6)))
      root.add(target)
      beam.target = target
      beams.push(beam)
    }
  }

  const glow = (meshes: Mesh[], color: string, zOffset: number) => {
    if (!meshes.length) return undefined
    const center = worldBox(meshes).getCenter(new Vector3())
    center.z += zOffset
    return addLight(root, new PointLight(color, 0, 3, 2), center)
  }
  // 辅助光放在灯组后方，离车身太近会在漆面上形成光斑
  const tailGlow = glow(tailMeshes, '#ff1a1a', -0.8)
  const turnGlowL = glow(leftTurn, '#ffa000', -0.8)
  const turnGlowR = glow(rightTurn, '#ffa000', -0.8)

  const turnState = (s: CarState, nowMs: number) => {
    if (nowMs < s.flashUntil) {
      const on = (s.flashUntil - nowMs) % FLASH_PERIOD_MS > FLASH_PERIOD_MS / 2
      return { left: on, right: on }
    }
    const blink = nowMs % TURN_PERIOD_MS < TURN_PERIOD_MS / 2
    return {
      left: blink && (s.turn === 'left' || s.turn === 'hazard'),
      right: blink && (s.turn === 'right' || s.turn === 'hazard'),
    }
  }

  return {
    update: (s, dt, nowMs) => {
      const nightBoost = s.night ? 1 : 0.35
      const headLevel = head.update(s.headlight, dt)
      beams.forEach((b) => (b.intensity = 90 * headLevel * nightBoost))

      const tailLevel = tail.update(s.taillight, dt)
      if (tailGlow) tailGlow.intensity = 0.8 * tailLevel * nightBoost

      const turn = turnState(s, nowMs)
      const l = turnL.update(turn.left, dt)
      const r = turnR.update(turn.right, dt)
      if (turnGlowL) turnGlowL.intensity = 1.2 * l * nightBoost
      if (turnGlowR) turnGlowR.intensity = 1.2 * r * nightBoost
    },
  }
}
