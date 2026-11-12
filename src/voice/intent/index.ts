import type { CarCommand } from '../../core/commandTypes'
import type { ParserKind } from '../../core/logSlice'
import { isAiReady, useAiSettings } from './aiSettings'
import { LlmError, parseByLlm } from './llmParser'
import { parseByRules } from './ruleParser'

export interface Interpretation {
  commands: CarCommand[]
  parser: ParserKind
  note?: string
}

/** 开启 AI 时优先用大模型解析，失败时回退到本地规则 */
export async function interpret(text: string): Promise<Interpretation> {
  const settings = useAiSettings.getState()
  if (!isAiReady(settings)) return { commands: parseByRules(text), parser: 'rule' }

  try {
    const { commands, reply, rejected } = await parseByLlm(text, settings)
    const notes = [reply && `AI：${reply}`, rejected > 0 && `已过滤 ${rejected} 条不合法指令`].filter(Boolean)
    return { commands, parser: 'ai', note: notes.join('；') || undefined }
  } catch (e) {
    const reason = e instanceof LlmError ? e.message : String(e)
    return { commands: parseByRules(text), parser: 'ai-fallback', note: `AI 解析失败：${reason}` }
  }
}
