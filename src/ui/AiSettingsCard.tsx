import { useState } from 'react'
import { describeCommand } from '../core/commands'
import { AI_PRESETS, isAiReady, useAiSettings } from '../voice/intent/aiSettings'
import { parseByLlm } from '../voice/intent/llmParser'

type TestState = { status: 'idle' } | { status: 'testing' } | { status: 'ok' | 'error'; message: string }

const TEST_PHRASE = '有点闷，把主驾窗户开一半'

export function AiSettingsCard() {
  const settings = useAiSettings()
  const [test, setTest] = useState<TestState>({ status: 'idle' })
  const ready = isAiReady(settings)

  const selectPreset = (id: string) => {
    const preset = AI_PRESETS.find((p) => p.id === id)!
    settings.update(id === 'custom' ? { presetId: id } : { presetId: id, baseUrl: preset.baseUrl, model: preset.model })
  }

  const runTest = async () => {
    setTest({ status: 'testing' })
    try {
      const { commands, reply } = await parseByLlm(TEST_PHRASE, settings)
      const parsed = commands.map(describeCommand).join('；') || '（无指令）'
      setTest({ status: 'ok', message: `「${TEST_PHRASE}」→ ${parsed}${reply ? `；AI：${reply}` : ''}` })
    } catch (e) {
      setTest({ status: 'error', message: (e as Error).message })
    }
  }

  return (
    <details className="card ai-card">
      <summary className="card-header">
        <h3>AI 意图理解</h3>
        <span className={`tag ${ready ? 'tag-parser-ai' : ''}`}>{ready ? '已启用' : settings.enabled ? '未配置完整' : '未启用'}</span>
      </summary>

      <label className="switch-row">
        <input type="checkbox" checked={settings.enabled} onChange={(e) => settings.update({ enabled: e.target.checked })} />
        使用大模型解析语音指令（失败时自动回退到本地规则）
      </label>

      <div className="field">
        <span>服务商</span>
        <select value={settings.presetId} onChange={(e) => selectPreset(e.target.value)}>
          {AI_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <label className="field">
        <span>Base URL</span>
        <input value={settings.baseUrl} onChange={(e) => settings.update({ baseUrl: e.target.value, presetId: 'custom' })} placeholder="https://.../v1" />
      </label>
      <label className="field">
        <span>模型</span>
        <input value={settings.model} onChange={(e) => settings.update({ model: e.target.value })} />
      </label>
      <label className="field">
        <span>API Key</span>
        <input type="password" value={settings.apiKey} onChange={(e) => settings.update({ apiKey: e.target.value })} placeholder="sk-..." autoComplete="off" />
      </label>

      <div className="ai-actions">
        <button className="btn" onClick={runTest} disabled={!settings.baseUrl || !settings.apiKey || !settings.model || test.status === 'testing'}>
          {test.status === 'testing' ? '测试中…' : '测试连接'}
        </button>
      </div>
      {(test.status === 'ok' || test.status === 'error') && (
        <p className={`notice ${test.status === 'ok' ? 'ok' : 'err'}`}>{test.message}</p>
      )}
      <p className="notice warn">
        API Key 仅保存在本机浏览器的 localStorage 中，并由浏览器直接请求服务商接口。这种方式只适合本地 Demo，正式产品应通过后端代理调用。
      </p>
    </details>
  )
}
