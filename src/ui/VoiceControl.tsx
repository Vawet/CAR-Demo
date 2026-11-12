import { useState, type FormEvent } from 'react'
import { handleUtterance } from '../voice/handleUtterance'
import { useSpeechRecognition, type UnsupportedReason } from '../voice/useSpeechRecognition'

const UNSUPPORTED_MESSAGES: Record<UnsupportedReason, string> = {
  'no-api': '当前浏览器不支持 Web Speech API，请使用 Chrome 或 Edge。也可以在下方输入文字指令。',
  insecure: '语音识别需要在 localhost 或 HTTPS 下访问。也可以在下方输入文字指令。',
}

export function VoiceControl() {
  const voice = useSpeechRecognition({ onFinal: (text) => void handleUtterance(text, 'voice') })
  const [text, setText] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    void handleUtterance(value, 'text')
    setText('')
  }

  return (
    <section className="card">
      <header className="card-header">
        <h3>语音控制</h3>
        <button
          className={`btn mic-btn ${voice.listening ? 'listening' : 'btn-primary'}`}
          disabled={!!voice.unsupported}
          onClick={voice.listening ? voice.stop : voice.start}
        >
          {voice.listening ? '停止语音' : '开启语音'}
        </button>
      </header>

      {voice.unsupported && <p className="notice warn">{UNSUPPORTED_MESSAGES[voice.unsupported]}</p>}
      {voice.error && <p className="notice err">{voice.error}</p>}

      <div className={`transcript ${voice.listening ? 'active' : ''}`}>
        {voice.listening ? (
          <>
            <span className="pulse" />
            {voice.interim || '正在聆听… 试试说「打开车门」「打开大灯」「雨刷快一点」「锁车」'}
          </>
        ) : (
          <span className="muted">点击「开启语音」后说出指令</span>
        )}
      </div>

      <form className="text-command" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="或输入文字指令，例如：打开双闪" />
        <button className="btn" type="submit">
          发送
        </button>
      </form>
    </section>
  )
}
