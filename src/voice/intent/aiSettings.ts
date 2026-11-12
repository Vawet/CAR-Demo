import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AiPreset {
  id: string
  label: string
  baseUrl: string
  model: string
}

/** 均为 OpenAI 兼容的 /chat/completions 接口 */
export const AI_PRESETS: AiPreset[] = [
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'qwen', label: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'custom', label: '自定义', baseUrl: '', model: '' },
]

export interface AiSettings {
  enabled: boolean
  presetId: string
  baseUrl: string
  apiKey: string
  model: string
  update: (patch: Partial<Omit<AiSettings, 'update'>>) => void
}

export const useAiSettings = create<AiSettings>()(
  persist(
    (set) => ({
      enabled: false,
      presetId: 'deepseek',
      baseUrl: AI_PRESETS[1].baseUrl,
      apiKey: '',
      model: AI_PRESETS[1].model,
      update: (patch) => set(patch),
    }),
    { name: 'car-demo.ai-settings' },
  ),
)

export function isAiReady(s: Pick<AiSettings, 'enabled' | 'baseUrl' | 'apiKey' | 'model'>) {
  return s.enabled && !!s.baseUrl && !!s.apiKey && !!s.model
}
