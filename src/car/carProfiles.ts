import type { DoorId } from '../features/door/doorTypes'
import type { WindowId } from '../features/window/windowTypes'

type Vec3 = [number, number, number]

export interface WindowPartConfig {
  /** glb 中车窗玻璃的 mesh/节点名，可以有多个 */
  meshNames: string[]
  /** 玻璃下降距离占玻璃高度的比例 */
  travel?: number
}

export interface DoorPartConfig {
  node: string
  /** butterfly：蝴蝶门，绕前上方铰链向上外翻；swing：普通侧开门 */
  style: 'butterfly' | 'swing'
}

export interface LightPartsConfig {
  headlight?: string[]
  taillight?: string[]
  /** 左右转向灯在同一个 mesh 中时，会按车身左右自动拆分 */
  turnSignal?: string[]
}

export interface WiperPartConfig {
  node: string
  /** 归一化后世界坐标系中的旋转轴（大致垂直于前挡风玻璃），节点原点为转轴 */
  axis: Vec3
  /** 摆动角度，正负决定方向 */
  sweepDeg: number
}

export interface CarProfile {
  id: string
  name: string
  url: string
  /** 归一化后车身长度（米） */
  length: number
  /** 绕 Y 轴旋转（弧度），让车头朝向 +Z、车身左侧朝向 +X */
  rotationY: number
  attribution: { title: string; author: string; license: string; url: string }
  windows: Partial<Record<WindowId, WindowPartConfig>>
  doors: Partial<Record<DoorId, DoorPartConfig>>
  lights: LightPartsConfig
  wiper?: WiperPartConfig
}

export const CAR_PROFILES: Record<string, CarProfile> = {
  concept: {
    id: 'concept',
    name: 'Khronos Car Concept',
    url: '/models/car-concept.glb',
    length: 4.6,
    rotationY: 0,
    attribution: {
      title: 'Car Concept',
      author: 'Eric Chadwick / Darmstadt Graphics Group',
      license: 'CC-BY 4.0',
      url: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept',
    },
    windows: {
      frontLeft: { meshNames: ['BodyDoorLWindow'] },
      frontRight: { meshNames: ['BodyDoorRWindow'] },
    },
    doors: {
      frontLeft: { node: 'BodyDoorLColor1', style: 'butterfly' },
      frontRight: { node: 'BodyDoorRColor1', style: 'butterfly' },
    },
    lights: {
      headlight: ['BodyHeadlights'],
      taillight: ['BodyTaillights'],
      turnSignal: ['BodyTurnsignalsRear'],
    },
    wiper: { node: 'BodyWindshieldWipers', axis: [0, 0.98, 0.19], sweepDeg: -95 },
  },
}

export function resolveProfile(): CarProfile {
  const id = new URLSearchParams(window.location.search).get('car')
  return (id && CAR_PROFILES[id]) || CAR_PROFILES.concept
}
