import type { StateCreator } from 'zustand'
import { isMoving, stepToward, type Animated } from '../../core/animated'
import { DOOR_IDS, type DoorId } from './doorTypes'

export interface DoorSlice {
  doors: Record<DoorId, Animated>
  availableDoors: DoorId[]
  locked: boolean
  setAvailableDoors: (ids: DoorId[]) => void
  setDoorTarget: (id: DoorId, target: number) => void
  setLocked: (locked: boolean) => void
  tickDoors: (dt: number) => void
}

const DOOR_TRAVEL_SECONDS = 1.4

export const createDoorSlice: StateCreator<DoorSlice, [], [], DoorSlice> = (set, get) => ({
  doors: Object.fromEntries(DOOR_IDS.map((id) => [id, { position: 0, target: 0 }])) as Record<DoorId, Animated>,
  availableDoors: [],
  locked: false,

  setAvailableDoors: (ids) => set({ availableDoors: ids }),
  setDoorTarget: (id, target) => set((s) => ({ doors: { ...s.doors, [id]: { ...s.doors[id], target } } })),
  setLocked: (locked) => set({ locked }),

  tickDoors: (dt) => {
    const { doors } = get()
    let next: Record<DoorId, Animated> | null = null
    for (const id of DOOR_IDS) {
      if (!isMoving(doors[id])) continue
      next ??= { ...doors }
      next[id] = { ...doors[id], position: stepToward(doors[id], dt, DOOR_TRAVEL_SECONDS) }
    }
    if (next) set({ doors: next })
  },
})

export function doorStatusLabel(d: Animated) {
  if (d.position < d.target) return '打开中'
  if (d.position > d.target) return '关闭中'
  return d.position > 0 ? '已打开' : '已关闭'
}
