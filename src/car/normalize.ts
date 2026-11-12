import { Box3, Object3D, Vector3 } from 'three'

/** 把任意车模缩放到指定车长、水平居中并落到地面 y=0 */
export function normalizeCar(root: Object3D, targetLength: number, rotationY: number) {
  root.rotation.set(0, rotationY, 0)
  root.position.set(0, 0, 0)
  root.scale.setScalar(1)
  root.updateMatrixWorld(true)

  const box = new Box3().setFromObject(root)
  const size = box.getSize(new Vector3())
  const scale = targetLength / Math.max(size.x, size.z)
  root.scale.setScalar(scale)
  root.updateMatrixWorld(true)

  box.setFromObject(root)
  const center = box.getCenter(new Vector3())
  root.position.set(-center.x, -box.min.y, -center.z)
  root.updateMatrixWorld(true)
}

export function listMeshNames(root: Object3D): string[] {
  const names: string[] = []
  root.traverse((o) => {
    if ((o as { isMesh?: boolean }).isMesh) names.push(`${o.name}  <- ${o.parent?.name ?? ''}`)
  })
  return names
}
