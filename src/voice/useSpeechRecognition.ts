import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpeechRecognitionCtor, type SpeechRecognition } from './speechTypes'

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': '麦克风权限被拒绝，请在浏览器地址栏中允许麦克风访问',
  'service-not-allowed': '浏览器不允许使用语音识别服务',
  'audio-capture': '没有检测到麦克风设备',
  network: '语音识别需要联网（Chrome 使用在线识别服务），请检查网络',
  'language-not-supported': '当前浏览器不支持中文语音识别',
}

/** 这些错误无法通过自动重启恢复，需要停止监听 */
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'])

export type UnsupportedReason = 'no-api' | 'insecure'

interface Options {
  lang?: string
  onFinal: (transcript: string) => void
}

export function useSpeechRecognition({ lang = 'zh-CN', onFinal }: Options) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string>()

  const unsupported: UnsupportedReason | undefined = !window.isSecureContext
    ? 'insecure'
    : getSpeechRecognitionCtor()
      ? undefined
      : 'no-api'

  const recognitionRef = useRef<SpeechRecognition>()
  /** 用户期望处于监听状态；Chrome 静音一段时间后会自动结束，需要重启 */
  const wantListeningRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current
    const Ctor = getSpeechRecognitionCtor()!
    const r = new Ctor()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    r.maxAlternatives = 1

    r.onstart = () => setListening(true)
    r.onresult = (e) => {
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text = result[0].transcript.trim()
        if (result.isFinal) {
          if (text) onFinalRef.current(text)
        } else {
          interimText += text
        }
      }
      setInterim(interimText)
    }
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      setError(ERROR_MESSAGES[e.error] ?? `语音识别出错：${e.error}`)
      if (FATAL_ERRORS.has(e.error)) wantListeningRef.current = false
    }
    r.onend = () => {
      setInterim('')
      if (wantListeningRef.current) {
        try {
          r.start()
          return
        } catch {
          wantListeningRef.current = false
        }
      }
      setListening(false)
    }
    recognitionRef.current = r
    return r
  }, [lang])

  const start = useCallback(() => {
    if (unsupported) return
    setError(undefined)
    wantListeningRef.current = true
    try {
      ensureRecognition().start()
    } catch {
      // 已经在监听中时 start() 会抛 InvalidStateError，忽略即可
    }
  }, [ensureRecognition, unsupported])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    recognitionRef.current?.stop()
  }, [])

  useEffect(
    () => () => {
      wantListeningRef.current = false
      recognitionRef.current?.abort()
    },
    [],
  )

  return { unsupported, listening, interim, error, start, stop }
}
