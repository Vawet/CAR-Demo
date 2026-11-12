export type LightTarget = 'headlight' | 'taillight' | 'leftTurn' | 'rightTurn' | 'hazard' | 'all'

export const LIGHT_LABELS: Record<LightTarget, string> = {
  headlight: '大灯',
  taillight: '尾灯',
  leftTurn: '左转向灯',
  rightTurn: '右转向灯',
  hazard: '双闪',
  all: '全部车灯',
}

/** 转向灯与双闪互斥 */
export type TurnMode = 'off' | 'left' | 'right' | 'hazard'

export interface LightCommand {
  domain: 'light'
  action: 'on' | 'off' | 'toggle'
  target: LightTarget
}
