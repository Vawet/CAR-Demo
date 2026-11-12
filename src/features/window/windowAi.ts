import type { CarState } from '../../core/store'
import { getWindowStatus } from './windowSlice'
import { WINDOW_IDS, WINDOW_LABELS, WINDOW_STATUS_LABELS, type WindowCommand, type WindowId } from './windowTypes'

/** 写给大模型的车窗指令说明 */
export const WINDOW_AI_SPEC = `车窗指令 domain="window"：
- action: "open" 全开 | "close" 全关 | "toggle" 切换 | "set" 开到指定开度（需要 value）
- target: ${WINDOW_IDS.map((id) => `"${id}"（${WINDOW_LABELS[id]}）`).join(' | ')} | "all"（全部车窗）
- value: 0~1 的数字，0 为全关，1 为全开，仅 action="set" 时需要
示例：{"domain":"window","action":"set","target":"frontLeft","value":0.5}`

export function describeWindowState(state: CarState): string {
  const lines = WINDOW_IDS.map((id) => {
    if (!state.availableWindows.includes(id)) return `- ${id}（${WINDOW_LABELS[id]}）：当前车型没有该车窗`
    const w = state.windows[id]
    return `- ${id}（${WINDOW_LABELS[id]}）：${WINDOW_STATUS_LABELS[getWindowStatus(w)]}，开度 ${Math.round(w.target * 100)}%`
  })
  return `车窗状态：\n${lines.join('\n')}`
}

/** 校验大模型返回的对象，不合法时返回 null */
export function validateWindowCommand(raw: Record<string, unknown>): WindowCommand | null {
  const { action, target, value } = raw
  if (action !== 'open' && action !== 'close' && action !== 'toggle' && action !== 'set') return null
  if (target !== 'all' && !WINDOW_IDS.includes(target as WindowId)) return null
  if (action === 'set') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return { domain: 'window', action, target: target as WindowId | 'all', value: Math.min(1, Math.max(0, value)) }
  }
  return { domain: 'window', action, target: target as WindowId | 'all' }
}
