import { PropertyBinding, type Object3D } from 'three'
import type { PartTag } from '../core/feature'
import type { CarState } from '../core/store'

export type { PartTag }

export function tagPart(object: Object3D, tag: PartTag) {
  object.userData.part = tag
}

/** 从命中的 mesh 向上查找最近的部件标记，例如车门玻璃属于车窗，车门把手属于车门 */
export function findPartTag(object: Object3D | null): PartTag | undefined {
  for (let o = object; o; o = o.parent) {
    if (o.userData.part) return o.userData.part as PartTag
  }
  return undefined
}

export function samePart(a?: PartTag, b?: PartTag) {
  return a?.domain === b?.domain && a?.id === b?.id
}

export function findNode(root: Object3D, name: string) {
  return root.getObjectByName(PropertyBinding.sanitizeNodeName(name))
}

/** 每个部件的 3D 绑定：逐帧根据状态更新，可选支持悬停高亮 */
export interface CarRig {
  /** 挂载后调用一次，用于向 store 同步当前车型支持的部件 */
  mount?: () => void
  update: (state: CarState, dt: number, nowMs: number) => void
  setHighlighted?: (tag: PartTag, on: boolean) => void
}
