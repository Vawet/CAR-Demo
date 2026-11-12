import { Color, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { findPartTag, samePart, type PartTag } from './partTag'

const HIGHLIGHT = new Color('#1d4f7a')

/**
 * 克隆部件下各 mesh 的材质（与车身其它部位解绑），返回切换悬停高亮的函数。
 * 属于其它部件的子节点（例如车门上的车窗玻璃）不受影响。
 */
export function makeHighlightable(node: Object3D, tag: PartTag): (on: boolean) => void {
  const materials: MeshStandardMaterial[] = []
  const originals: Color[] = []
  node.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh || !samePart(findPartTag(mesh), tag)) return
    const clone = (m: Material) => {
      const c = m.clone() as MeshStandardMaterial
      if (c.emissive && !c.emissiveMap) {
        materials.push(c)
        originals.push(c.emissive.clone())
      }
      return c
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material)
  })
  return (on) => materials.forEach((m, i) => m.emissive.copy(on ? HIGHLIGHT : originals[i]))
}
