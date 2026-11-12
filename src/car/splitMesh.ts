import { BufferGeometry, Mesh, Vector3, type Material } from 'three'

/**
 * 按三角形中心的世界 x 坐标把 mesh 拆成两半（车身左侧为 +X）。
 * 两个新 mesh 共享原顶点数据，各自使用独立的材质，原 mesh 被移除。
 */
export function splitMeshLeftRight(mesh: Mesh): { left: Mesh; right: Mesh } {
  const geometry = mesh.geometry
  const position = geometry.attributes.position
  const index = geometry.index
  const triCount = (index ? index.count : position.count) / 3
  const vertexAt = (i: number) => (index ? index.getX(i) : i)

  mesh.updateWorldMatrix(true, false)
  const v = new Vector3()
  const left: number[] = []
  const right: number[] = []
  for (let t = 0; t < triCount; t++) {
    let x = 0
    for (let k = 0; k < 3; k++) x += v.fromBufferAttribute(position, vertexAt(t * 3 + k)).applyMatrix4(mesh.matrixWorld).x
    const target = x > 0 ? left : right
    for (let k = 0; k < 3; k++) target.push(vertexAt(t * 3 + k))
  }

  const make = (indices: number[]) => {
    const g = new BufferGeometry()
    for (const [name, attr] of Object.entries(geometry.attributes)) g.setAttribute(name, attr)
    g.setIndex(indices)
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material).clone() as Material
    const m = new Mesh(g, material)
    m.name = mesh.name
    m.position.copy(mesh.position)
    m.quaternion.copy(mesh.quaternion)
    m.scale.copy(mesh.scale)
    m.castShadow = mesh.castShadow
    mesh.parent!.add(m)
    return m
  }

  const result = { left: make(left), right: make(right) }
  mesh.removeFromParent()
  return result
}
