import type { StateCreator } from 'zustand'
import type { TurnMode } from './lightTypes'

export interface LightSlice {
  headlight: boolean
  taillight: boolean
  turn: TurnMode
  /** 锁车 / 解锁时双闪提示，在 performance.now() 到达该时刻前闪烁 */
  flashUntil: number
  setLights: (patch: Partial<Pick<LightSlice, 'headlight' | 'taillight' | 'turn'>>) => void
  flash: (times: number) => void
}

/** 一次闪烁（亮 + 灭）的时长，毫秒 */
export const FLASH_PERIOD_MS = 500

export const createLightSlice: StateCreator<LightSlice, [], [], LightSlice> = (set) => ({
  headlight: false,
  taillight: false,
  turn: 'off',
  flashUntil: 0,
  setLights: (patch) => set(patch),
  flash: (times) => set({ flashUntil: performance.now() + times * FLASH_PERIOD_MS }),
})
