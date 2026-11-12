import { describeCommand } from '../core/commands'
import type { LogEntry } from '../core/logSlice'
import { useCarStore } from '../core/store'

const SOURCE_LABELS: Record<LogEntry['source'], string> = {
  voice: '语音',
  text: '文字',
  click: '点击',
  panel: '面板',
}

const PARSER_LABELS: Record<NonNullable<LogEntry['parser']>, string> = {
  rule: '规则解析',
  ai: 'AI 解析',
  'ai-fallback': 'AI 失败，已回退规则',
}

export function VoiceLog() {
  const logs = useCarStore((s) => s.logs)
  const clearLogs = useCarStore((s) => s.clearLogs)

  return (
    <section className="card log-card">
      <header className="card-header">
        <h3>操作日志</h3>
        <button className="btn btn-small" onClick={clearLogs} disabled={!logs.length}>
          清空
        </button>
      </header>
      {logs.length === 0 ? (
        <p className="muted">暂无记录</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <LogItem key={log.id} log={log} />
          ))}
        </ul>
      )}
    </section>
  )
}

function LogItem({ log }: { log: LogEntry }) {
  return (
    <li className="log-item">
      <div className="log-meta">
        <span className={`tag tag-${log.source}`}>{SOURCE_LABELS[log.source]}</span>
        {log.parser && <span className={`tag tag-parser-${log.parser}`}>{PARSER_LABELS[log.parser]}</span>}
        <time>{new Date(log.time).toLocaleTimeString()}</time>
      </div>
      {log.input && <div className="log-input">「{log.input}」</div>}
      {log.status === 'pending' && <div className="log-line muted">解析中…</div>}
      {log.status === 'unrecognized' && <div className="log-line warn">未识别到车控指令</div>}
      {log.input && log.results.length > 0 && (
        <div className="log-line muted">解析为：{log.results.map((r) => describeCommand(r.command)).join('；')}</div>
      )}
      {log.results.map((r, i) => (
        <div key={i} className={`log-line ${r.ok ? 'ok' : 'err'}`}>
          {r.ok ? '✓' : '✗'} {r.message}
        </div>
      ))}
      {log.note && <div className="log-line muted">{log.note}</div>}
    </li>
  )
}
