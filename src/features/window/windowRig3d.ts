import type { Object3D } from 'three'
import type { CarProfile } from '../../car/carProfiles'
import type { CarRig } from '../../car/partTag'
import { useCarStore } from '../../core/store'
import { WindowRig } from './WindowRig'
import { WINDOW_IDS, type WindowId } from './windowTypes'

/** 需要在已归一化、且 matrixWorld 已更新的车模上调用 */
export function createWindowRig(root: Object3D, profile: CarProfile): CarRig {
  const rigs = new Map<WindowId, WindowRig>()
  for (const id of WINDOW_IDS) {
    const config = profile.windows[id]
    const rig = config && WindowRig.create(root, id, config)
    if (rig) rigs.set(id, rig)
  }
  return {
    mount: () => useCarStore.getState().setAvailableWindows([...rigs.keys()]),
    update: (state) => rigs.forEach((rig, id) => rig.apply(state.windows[id].position)),
    setHighlighted: (tag, on) => tag.domain === 'window' && rigs.get(tag.id as WindowId)?.setHighlighted(on),
  }
}
