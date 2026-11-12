import { MathUtils, Quaternion, Vector3, type Object3D } from 'three'
import type { CarProfile } from '../../car/carProfiles'
import { makeHighlightable } from '../../car/highlight'
import { findNode, tagPart, type CarRig } from '../../car/partTag'
import { useCarStore } from '../../core/store'
import type { WiperMode } from './wiperSlice'

/** 一个来回所需秒数 */
const PERIOD_SECONDS: Record<WiperMode, number> = { off: 1.6, low: 1.6, high: 0.8, once: 1.2 }

export function createWiperRig(root: Object3D, profile: CarProfile): CarRig | null {
  const config = profile.wiper
  const node = config && findNode(root, config.node)
  if (!config || !node) return null

  const tag = { domain: 'wiper' as const, id: 'wiper' }
  tagPart(node, tag)
  const setHighlighted = makeHighlightable(node, tag)

  const axis = new Vector3(...config.axis).normalize()
  const sweep = MathUtils.degToRad(config.sweepDeg)
  const parentQuat = node.parent!.getWorldQuaternion(new Quaternion())
  const parentQuatInv = parentQuat.clone().invert()
  const baseQuat = node.quaternion.clone()
  const rotation = new Quaternion()

  /** 0~1 一个来回的相位；关闭后会把当前这一下刮完再停在初始位置 */
  let phase = 0
  let lastMode: WiperMode = 'off'

  return {
    mount: () => useCarStore.getState().setHasWiper(true),
    update: (state, dt) => {
      const mode = state.wiperMode
      if (mode === 'off' && phase === 0) return
      if (mode === 'once' && lastMode !== 'once') phase = 0
      lastMode = mode

      phase += dt / PERIOD_SECONDS[mode]
      if (phase >= 1) {
        phase = mode === 'off' || mode === 'once' ? 0 : phase % 1
        if (mode === 'once') state.setWiperMode('off')
      }

      const angle = (sweep * (1 - Math.cos(phase * Math.PI * 2))) / 2
      rotation.setFromAxisAngle(axis, angle)
      node.quaternion.copy(parentQuatInv).multiply(rotation).multiply(parentQuat).multiply(baseQuat)
    },
    setHighlighted: (t, on) => t.domain === 'wiper' && setHighlighted(on),
  }
}
