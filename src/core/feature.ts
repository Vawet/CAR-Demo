import type { CarCommand, CommandResult } from './commandTypes'
import type { CarState } from './store'

/** 挂在 3D 节点 userData.part 上，标识它属于哪个车控部件 */
export interface PartTag {
  domain: CarCommand['domain']
  id: string
}

/**
 * 一个车控能力的全部逻辑：执行、描述、规则解析、AI 说明、点击行为。
 * 新增能力时实现该接口，并在 features/registry.ts 中注册。
 */
export interface FeatureModule<C extends CarCommand> {
  domain: C['domain']
  execute: (cmd: C) => CommandResult
  describe: (cmd: C) => string
  /** 逐帧推进动画状态（可选） */
  tick?: (dt: number) => void
  rules: {
    /** inheritDomain 为 true 时表示上一子句在说同一能力，本句可以省略领域词 */
    parse: (clause: string, inheritDomain: boolean) => C[] | null
  }
  ai: {
    spec: string
    describeState: (state: CarState) => string
    validate: (raw: Record<string, unknown>) => C | null
  }
  part?: {
    label: (tag: PartTag, state: CarState) => string
    click: (tag: PartTag, state: CarState) => C
  }
}
