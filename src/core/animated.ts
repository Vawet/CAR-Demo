/** 0~1 之间匀速逼近的动画值，0 = 关闭，1 = 打开 */
export interface Animated {
  position: number
  target: number
}

export function stepToward(v: Animated, dt: number, fullTravelSeconds: number): number {
  const step = dt / fullTravelSeconds
  const delta = v.target - v.position
  return Math.abs(delta) <= step ? v.target : v.position + Math.sign(delta) * step
}

export function isMoving(v: Animated) {
  return v.position !== v.target
}

export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}
