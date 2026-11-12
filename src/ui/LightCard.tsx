import { useShallow } from 'zustand/react/shallow'
import { runCommands } from '../core/commands'
import { useCarStore } from '../core/store'
import { isLightOn } from '../features/light'
import { LIGHT_LABELS, type LightTarget } from '../features/light/lightTypes'
import { WIPER_MODE_LABELS, type WiperMode } from '../features/wiper/wiperSlice'

const LIGHT_TARGETS: LightTarget[] = ['headlight', 'taillight', 'leftTurn', 'hazard', 'rightTurn']
const WIPER_MODES: WiperMode[] = ['off', 'low', 'high', 'once']

export function LightCard() {
  const state = useCarStore(
    useShallow((s) => ({ headlight: s.headlight, taillight: s.taillight, turn: s.turn, wiperMode: s.wiperMode, hasWiper: s.hasWiper })),
  )

  return (
    <section className="card">
      <header className="card-header">
        <h3>车灯</h3>
        <button className="btn btn-small" onClick={() => runCommands([{ domain: 'light', action: 'off', target: 'all' }], 'panel')}>
          全部关闭
        </button>
      </header>
      <div className="chip-grid">
        {LIGHT_TARGETS.map((target) => (
          <button
            key={target}
            className={`chip ${isLightOn(state, target) ? 'chip-on' : ''} chip-${target}`}
            onClick={() => runCommands([{ domain: 'light', action: 'toggle', target }], 'panel')}
          >
            {LIGHT_LABELS[target]}
          </button>
        ))}
      </div>

      <header className="card-header sub-header">
        <h3>雨刷</h3>
        {!state.hasWiper && <span className="muted">当前车型不支持</span>}
      </header>
      <div className="segmented">
        {WIPER_MODES.map((mode) => (
          <button
            key={mode}
            disabled={!state.hasWiper}
            className={state.wiperMode === mode ? 'active' : ''}
            onClick={() => runCommands([{ domain: 'wiper', action: mode }], 'panel')}
          >
            {WIPER_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </section>
  )
}
