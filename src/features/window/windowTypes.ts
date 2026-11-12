export const WINDOW_IDS = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'] as const
export type WindowId = (typeof WINDOW_IDS)[number]

export const WINDOW_LABELS: Record<WindowId, string> = {
  frontLeft: '左前（主驾）',
  frontRight: '右前（副驾）',
  rearLeft: '左后',
  rearRight: '右后',
}

export type WindowAction = 'open' | 'close' | 'toggle' | 'set'

export interface WindowCommand {
  domain: 'window'
  action: WindowAction
  target: WindowId | 'all'
  /** 0 = 全关, 1 = 全开；仅 action 为 'set' 时使用 */
  value?: number
}

export type WindowStatus = 'closed' | 'open' | 'partial' | 'opening' | 'closing'

export const WINDOW_STATUS_LABELS: Record<WindowStatus, string> = {
  closed: '已关闭',
  open: '已打开',
  partial: '半开',
  opening: '下降中',
  closing: '上升中',
}
