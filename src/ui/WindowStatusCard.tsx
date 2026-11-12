import { runCommands } from '../core/commands'
import { useCarStore } from '../core/store'
import { getWindowStatus } from '../features/window/windowSlice'
import { WINDOW_IDS, WINDOW_LABELS, WINDOW_STATUS_LABELS } from '../features/window/windowTypes'

export function WindowStatusCard() {
  const windows = useCarStore((s) => s.windows)
  const available = useCarStore((s) => s.availableWindows)

  return (
    <section className="card">
      <header className="card-header">
        <h3>车窗</h3>
        <div className="btn-group">
          <button className="btn" disabled={!available.length} onClick={() => runCommands([{ domain: 'window', action: 'open', target: 'all' }], 'panel')}>
            全部打开
          </button>
          <button className="btn" disabled={!available.length} onClick={() => runCommands([{ domain: 'window', action: 'close', target: 'all' }], 'panel')}>
            全部关闭
          </button>
        </div>
      </header>
      <ul className="window-list">
        {WINDOW_IDS.map((id) => {
          const w = windows[id]
          const enabled = available.includes(id)
          const status = getWindowStatus(w)
          return (
            <li key={id} className={enabled ? '' : 'disabled'} title={enabled ? '' : '当前车型没有该车窗'}>
              <span className="window-name">{WINDOW_LABELS[id]}</span>
              <div className="progress" aria-label={`开度 ${Math.round(w.position * 100)}%`}>
                <div className="progress-bar" style={{ width: `${w.position * 100}%` }} />
              </div>
              <span className={`badge badge-${status}`}>{enabled ? WINDOW_STATUS_LABELS[status] : '不支持'}</span>
              <button
                className="btn btn-small"
                disabled={!enabled}
                onClick={() => runCommands([{ domain: 'window', action: 'toggle', target: id }], 'panel')}
              >
                {w.target > 0 ? '关' : '开'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
