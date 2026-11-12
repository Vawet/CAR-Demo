import type { DoorCommand, LockCommand } from '../features/door/doorTypes'
import type { LightCommand } from '../features/light/lightTypes'
import type { SceneCommand } from '../features/scene/sceneSlice'
import type { WindowCommand } from '../features/window/windowTypes'
import type { WiperCommand } from '../features/wiper/wiperSlice'

/** 所有车控指令的联合类型；新增车控能力时在这里追加一个 domain */
export type CarCommand = WindowCommand | DoorCommand | LockCommand | LightCommand | WiperCommand | SceneCommand

export type CommandDomain = CarCommand['domain']

export interface CommandResult {
  ok: boolean
  message: string
}
