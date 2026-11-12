import type { FeatureModule } from '../../core/feature'
import { useCarStore } from '../../core/store'
import { includesAny, pickEarliest } from '../../voice/intent/ruleUtils'
import { WIPER_MODE_LABELS, type WiperCommand, type WiperMode } from './wiperSlice'

/** 点击雨刷时依次切换：关闭 → 低速 → 高速 → 关闭 */
const CLICK_CYCLE: Record<WiperMode, WiperMode> = { off: 'low', low: 'high', high: 'off', once: 'off' }

const WIPER_WORDS = ['雨刷', '雨刮', '刮水', '刮雨']
const WIPER_ACTIONS = {
  once: ['刮一下', '刮一次', '刮一刮'],
  off: ['关闭', '关掉', '关上', '停止', '停下', '停', '关'],
  high: ['高速', '快速', '最快', '快一点', '快点', '调快', '最大', '大雨'],
  low: ['低速', '慢速', '慢一点', '慢点', '调慢', '小雨', '打开', '开启', '启动', '开'],
}

export function parseWiperIntent(clause: string, inheritDomain = false): WiperCommand[] | null {
  if (!inheritDomain && !includesAny(clause, WIPER_WORDS)) return null
  const action = pickEarliest(clause, WIPER_ACTIONS)
  // 「打开雨刷，快一点」中速度词应优先于打开
  const speed = includesAny(clause, WIPER_ACTIONS.high) ? 'high' : includesAny(clause, ['低速', '慢']) ? 'low' : null
  const final = action === 'low' && speed ? speed : action
  return final ? [{ domain: 'wiper', action: final }] : null
}

export const wiperModule: FeatureModule<WiperCommand> = {
  domain: 'wiper',
  execute: (cmd) => {
    const { wiperMode, hasWiper, setWiperMode } = useCarStore.getState()
    if (!hasWiper) return { ok: false, message: '当前车型没有可控制的雨刷' }
    const mode = cmd.action === 'toggle' ? (wiperMode === 'off' ? 'low' : 'off') : cmd.action
    if (mode === wiperMode) return { ok: true, message: `雨刷已经是${WIPER_MODE_LABELS[mode]}状态` }
    setWiperMode(mode)
    return { ok: true, message: mode === 'off' ? '雨刷已关闭，将停在初始位置' : `雨刷：${WIPER_MODE_LABELS[mode]}` }
  },
  describe: (cmd) => (cmd.action === 'toggle' ? '切换雨刷' : `雨刷${WIPER_MODE_LABELS[cmd.action]}`),
  rules: { parse: parseWiperIntent },
  ai: {
    spec: `雨刷指令 domain="wiper"：
- action: "off" 关闭 | "low" 低速 | "high" 高速 | "once" 刮一次 | "toggle"`,
    describeState: (s) => `雨刷：${WIPER_MODE_LABELS[s.wiperMode]}`,
    validate: (raw) =>
      typeof raw.action === 'string' && (raw.action in WIPER_MODE_LABELS || raw.action === 'toggle')
        ? { domain: 'wiper', action: raw.action as WiperCommand['action'] }
        : null,
  },
  part: {
    label: (_, s) => `雨刷（${WIPER_MODE_LABELS[s.wiperMode]}）· 点击切换到${WIPER_MODE_LABELS[CLICK_CYCLE[s.wiperMode]]}`,
    click: (_, s) => ({ domain: 'wiper', action: CLICK_CYCLE[s.wiperMode] }),
  },
}
