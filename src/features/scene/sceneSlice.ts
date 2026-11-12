import type { StateCreator } from 'zustand'

export interface SceneCommand {
  domain: 'scene'
  action: 'day' | 'night' | 'toggle'
}

export interface SceneSlice {
  night: boolean
  setNight: (night: boolean) => void
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (set) => ({
  night: false,
  setNight: (night) => set({ night }),
})
