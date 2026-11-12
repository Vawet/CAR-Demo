import type { StateCreator } from 'zustand'

/** once：刮一次后自动停止 */
export type WiperMode = 'off' | 'low' | 'high' | 'once'

export const WIPER_MODE_LABELS: Record<WiperMode, string> = { off: '关闭', low: '低速', high: '高速', once: '刮一次' }

export interface WiperCommand {
  domain: 'wiper'
  action: WiperMode | 'toggle'
}

export interface WiperSlice {
  wiperMode: WiperMode
  hasWiper: boolean
  setWiperMode: (mode: WiperMode) => void
  setHasWiper: (has: boolean) => void
}

export const createWiperSlice: StateCreator<WiperSlice, [], [], WiperSlice> = (set) => ({
  wiperMode: 'off',
  hasWiper: false,
  setWiperMode: (wiperMode) => set({ wiperMode }),
  setHasWiper: (hasWiper) => set({ hasWiper }),
})
