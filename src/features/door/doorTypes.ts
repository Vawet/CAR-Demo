import { WINDOW_IDS, WINDOW_LABELS, type WindowId } from '../window/windowTypes'

/** 车门与车窗一一对应，沿用同一套 ID */
export const DOOR_IDS = WINDOW_IDS
export type DoorId = WindowId
export const DOOR_LABELS = WINDOW_LABELS

export interface DoorCommand {
  domain: 'door'
  action: 'open' | 'close' | 'toggle'
  target: DoorId | 'all'
}

export interface LockCommand {
  domain: 'lock'
  action: 'lock' | 'unlock' | 'toggle'
}
