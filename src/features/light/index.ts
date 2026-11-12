import type { CommandResult } from '../../core/commandTypes'
import type { FeatureModule } from '../../core/feature'
import { useCarStore, type CarState } from '../../core/store'
import { parseLightIntent } from './lightIntents'
import { LIGHT_LABELS, type LightCommand, type LightTarget, type TurnMode } from './lightTypes'

const TURN_MODES: Partial<Record<LightTarget, TurnMode>> = { leftTurn: 'left', rightTurn: 'right', hazard: 'hazard' }

export function isLightOn(s: Pick<CarState, 'headlight' | 'taillight' | 'turn'>, target: LightTarget): boolean {
  if (target === 'headlight') return s.headlight
  if (target === 'taillight') return s.taillight
  if (target === 'all') return s.headlight || s.taillight
  return s.turn === TURN_MODES[target]
}

function executeLight(cmd: LightCommand): CommandResult {
  const state = useCarStore.getState()
  const on = cmd.action === 'toggle' ? !isLightOn(state, cmd.target) : cmd.action === 'on'
  const name = LIGHT_LABELS[cmd.target]
  if (on === isLightOn(state, cmd.target)) return { ok: true, message: `${name}已经${on ? '打开' : '关闭'}` }

  switch (cmd.target) {
    case 'headlight':
    case 'taillight':
      state.setLights({ [cmd.target]: on })
      break
    case 'all':
      state.setLights(on ? { headlight: true, taillight: true } : { headlight: false, taillight: false, turn: 'off' })
      break
    default:
      state.setLights({ turn: on ? TURN_MODES[cmd.target]! : 'off' })
  }
  return { ok: true, message: `已${on ? '打开' : '关闭'}${name}` }
}

const TARGETS = Object.keys(LIGHT_LABELS) as LightTarget[]

export const lightModule: FeatureModule<LightCommand> = {
  domain: 'light',
  execute: executeLight,
  describe: (cmd) => `${{ on: '打开', off: '关闭', toggle: '切换' }[cmd.action]}${LIGHT_LABELS[cmd.target]}`,
  rules: { parse: parseLightIntent },
  ai: {
    spec: `车灯指令 domain="light"：
- action: "on" | "off" | "toggle"
- target: "headlight" 大灯 | "taillight" 尾灯 | "leftTurn" 左转向灯 | "rightTurn" 右转向灯 | "hazard" 双闪 | "all" 大灯加尾灯（关闭时包括转向灯）
左转、右转、双闪三者互斥，打开其中一个会关闭另外两个。`,
    describeState: (s) =>
      `车灯：大灯${s.headlight ? '开' : '关'}，尾灯${s.taillight ? '开' : '关'}，转向灯 ${{ off: '关', left: '左转', right: '右转', hazard: '双闪' }[s.turn]}`,
    validate: (raw) => {
      const { action, target } = raw
      if (action !== 'on' && action !== 'off' && action !== 'toggle') return null
      if (!TARGETS.includes(target as LightTarget)) return null
      return { domain: 'light', action, target: target as LightTarget }
    },
  },
  part: {
    label: (tag, s) => {
      const target = tag.id as LightTarget
      return `${LIGHT_LABELS[target]} · 点击${isLightOn(s, target) ? '关闭' : '打开'}`
    },
    click: (tag) => ({ domain: 'light', action: 'toggle', target: tag.id as LightTarget }),
  },
}
