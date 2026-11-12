import {
  Box3,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Plane,
  Vector3,
  type Material,
} from 'three'
import { findNode, tagPart, type PartTag } from '../../car/partTag'
import type { WindowPartConfig } from '../../car/carProfiles'
import type { WindowId } from './windowTypes'

interface GlassPiece {
  node: Object3D
  basePosition: Vector3
  /** 父节点局部坐标系下，从全关到全开的位移 */
  travel: Vector3
}

/** 把一扇车窗的玻璃节点绑定为可升降部件 */
export class WindowRig {
  readonly hotspots: Mesh[] = []
  private readonly pieces: GlassPiece[] = []
  private readonly hotspotMaterial: MeshBasicMaterial
  private readonly clipPlane = new Plane()
  private readonly localClipPlane = new Plane()
  private readonly anchor: Object3D

  private constructor(
    readonly id: WindowId,
    nodes: Object3D[],
    travelRatio: number,
  ) {
    this.anchor = nodes[0].parent!
    const tag: PartTag = { domain: 'window', id }

    const worldBox = new Box3()
    nodes.forEach((n) => worldBox.expandByObject(n))
    const distance = (worldBox.max.y - worldBox.min.y) * travelRatio

    // 裁剪面位于玻璃关闭时的下沿（腰线），只保留其上方部分
    const worldPlane = new Plane(new Vector3(0, 1, 0), -(worldBox.min.y - 0.002))
    this.localClipPlane.copy(worldPlane).applyMatrix4(new Matrix4().copy(this.anchor.matrixWorld).invert())

    this.hotspotMaterial = new MeshBasicMaterial({
      color: '#4fb3ff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: DoubleSide,
    })

    for (const node of nodes) {
      const parent = node.parent!
      const worldPos = node.getWorldPosition(new Vector3())
      const p0 = parent.worldToLocal(worldPos.clone())
      const p1 = parent.worldToLocal(worldPos.clone().add(new Vector3(0, -distance, 0)))
      this.pieces.push({ node, basePosition: node.position.clone(), travel: p1.sub(p0) })

      const parentInverse = new Matrix4().copy(parent.matrixWorld).invert()
      node.traverse((o) => {
        const mesh = o as Mesh
        if (!mesh.isMesh) return
        tagPart(mesh, tag)
        mesh.material = this.cloneWithClipping(mesh.material)

        // 热区：与玻璃同形状、固定在关闭位置的透明网格，车窗降下后依然可以点击
        const hotspot = new Mesh(mesh.geometry, this.hotspotMaterial)
        new Matrix4().multiplyMatrices(parentInverse, mesh.matrixWorld).decompose(hotspot.position, hotspot.quaternion, hotspot.scale)
        tagPart(hotspot, tag)
        hotspot.renderOrder = 10
        parent.add(hotspot)
        this.hotspots.push(hotspot)
      })
    }
  }

  static create(root: Object3D, id: WindowId, config: WindowPartConfig): WindowRig | null {
    const nodes = config.meshNames
      .map((name) => findNode(root, name))
      .filter((n): n is Object3D => !!n)
    if (nodes.length === 0) {
      console.warn(`[WindowRig] ${id}: 未找到节点 ${config.meshNames.join(', ')}`)
      return null
    }
    return new WindowRig(id, nodes, config.travel ?? 0.95)
  }

  /** position：0 = 全关，1 = 全开 */
  apply(position: number) {
    for (const p of this.pieces) p.node.position.copy(p.basePosition).addScaledVector(p.travel, position)
    this.clipPlane.copy(this.localClipPlane).applyMatrix4(this.anchor.matrixWorld)
  }

  setHighlighted(on: boolean) {
    this.hotspotMaterial.opacity = on ? 0.22 : 0
  }

  private cloneWithClipping(material: Material | Material[]): Material | Material[] {
    if (Array.isArray(material)) return material.map((m) => this.cloneWithClipping(m) as Material)
    const clone = material.clone()
    clone.clippingPlanes = [this.clipPlane]
    clone.clipShadows = true
    return clone
  }
}
