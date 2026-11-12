import { create } from 'zustand'
import { createDoorSlice, type DoorSlice } from '../features/door/doorSlice'
import { createLightSlice, type LightSlice } from '../features/light/lightSlice'
import { createSceneSlice, type SceneSlice } from '../features/scene/sceneSlice'
import { createWindowSlice, type WindowSlice } from '../features/window/windowSlice'
import { createWiperSlice, type WiperSlice } from '../features/wiper/wiperSlice'
import { createLogSlice, type LogSlice } from './logSlice'

export type CarState = WindowSlice & DoorSlice & LightSlice & WiperSlice & SceneSlice & LogSlice

export const useCarStore = create<CarState>()((...a) => ({
  ...createWindowSlice(...a),
  ...createDoorSlice(...a),
  ...createLightSlice(...a),
  ...createWiperSlice(...a),
  ...createSceneSlice(...a),
  ...createLogSlice(...a),
}))
