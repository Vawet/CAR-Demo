import type { StateCreator } from 'zustand'
import { isMoving, stepToward, type Animated } from '../../core/animated'
import { WINDOW_IDS, type WindowId, type WindowStatus } from './windowTypes'

export type WindowState = Animated

export interface WindowSlice {
  windows: Record<WindowId, WindowState>
  availableWindows: WindowId[]
  setAvailableWindows: (ids: WindowId[]) => void
  setWindowTarget: (id: WindowId, target: number) => void
  tickWindows: (dt: number) => void
}

/** 从全关到全开所需秒数 */
const FULL_TRAVEL_SECONDS = 2.2

const initialWindows = Object.fromEntries(
  WINDOW_IDS.map((id) => [id, { position: 0, target: 0 }]),
) as Record<WindowId, WindowState>

export const createWindowSlice: StateCreator<WindowSlice, [], [], WindowSlice> = (set, get) => ({
  windows: initialWindows,
  availableWindows: [],

  setAvailableWindows: (ids) => set({ availableWindows: ids }),

  setWindowTarget: (id, target) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], target: clamp01(target) } },
    })),

  tickWindows: (dt) => {
    const { windows } = get()
    let next: Record<WindowId, WindowState> | null = null
    for (const id of WINDOW_IDS) {
      const w = windows[id]
      if (!isMoving(w)) continue
      next ??= { ...windows }
      next[id] = { ...w, position: stepToward(w, dt, FULL_TRAVEL_SECONDS) }
    }
    if (next) set({ windows: next })
  },
})

export function getWindowStatus(w: WindowState): WindowStatus {
  if (w.position < w.target) return 'opening'
  if (w.position > w.target) return 'closing'
  if (w.position <= 0) return 'closed'
  if (w.position >= 1) return 'open'
  return 'partial'
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}
