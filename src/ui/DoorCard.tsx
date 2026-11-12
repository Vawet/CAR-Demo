import { runCommands } from '../core/commands'
import { useCarStore } from '../core/store'
import { doorStatusLabel } from '../features/door/doorSlice'
import { DOOR_IDS, DOOR_LABELS } from '../features/door/doorTypes'

export function DoorCard() {
  const doors = useCarStore((s) => s.doors)
  const available = useCarStore((s) => s.availableDoors)
  const locked = useCarStore((s) => s.locked)

  return (
    <section className="card">
      <header className="card-header">
        <h3>车门</h3>
        <button
          className={`btn ${locked ? 'btn-active' : ''}`}
          onClick={() => runCommands([{ domain: 'lock', action: 'toggle' }], 'panel')}
        >
          {locked ? '已上锁 · 点击解锁' : '未上锁 · 点击上锁'}
        </button>
      </header>
      <ul className="window-list">
        {DOOR_IDS.filter((id) => available.includes(id)).map((id) => {
          const d = doors[id]
          return (
            <li key={id}>
              <span className="window-name">{DOOR_LABELS[id]}</span>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${d.position * 100}%` }} />
              </div>
              <span className={`badge ${d.position > 0 ? 'badge-open' : ''}`}>{doorStatusLabel(d)}</span>
              <button className="btn btn-small" onClick={() => runCommands([{ domain: 'door', action: 'toggle', target: id }], 'panel')}>
                {d.target > 0 ? '关' : '开'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
