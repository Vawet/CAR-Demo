import { includesAny, pickEarliest } from '../../voice/intent/ruleUtils'
import type { LightCommand, LightTarget } from './lightTypes'

const LIGHT_ACTIONS = {
  on: ['打开', '开启', '点亮', '亮起', '打', '开', '亮'],
  off: ['关闭', '关掉', '关上', '熄灭', '关', '灭', '熄'],
}

const TARGET_WORDS: Array<[string[], LightTarget]> = [
  [['双闪', '危险报警', '警示灯', '应急灯'], 'hazard'],
  [['左转'], 'leftTurn'],
  [['右转'], 'rightTurn'],
  [['大灯', '前灯', '头灯', '远光', '近光', '前照灯'], 'headlight'],
  [['尾灯', '后灯', '示宽灯', '位置灯'], 'taillight'],
]

export function parseLightIntent(clause: string, inheritDomain = false): LightCommand[] | null {
  const targets = TARGET_WORDS.filter(([words]) => includesAny(clause, words)).map(([, t]) => t)
  if (!inheritDomain && !targets.length && !clause.includes('灯')) return null

  let action = pickEarliest(clause, LIGHT_ACTIONS)
  // 「打左转」「右转向灯」这类说法默认是打开
  if (!action && (targets.includes('leftTurn') || targets.includes('rightTurn') || targets.includes('hazard'))) action = 'on'
  if (!action) return null

  return (targets.length ? targets : (['all'] as LightTarget[])).map((target) => ({ domain: 'light', action: action!, target }))
}
