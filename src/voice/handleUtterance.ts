import { executeAll } from '../core/commands'
import type { LogSource } from '../core/logSlice'
import { useCarStore } from '../core/store'
import { interpret } from './intent'

/** 语音识别结果或手动输入的文本：解析意图、执行指令、写入日志 */
export async function handleUtterance(text: string, source: Extract<LogSource, 'voice' | 'text'>) {
  const { addLog, updateLog } = useCarStore.getState()
  const logId = addLog({ source, input: text, status: 'pending', results: [] })

  const { commands, parser, note } = await interpret(text)
  if (commands.length === 0) {
    updateLog(logId, { status: 'unrecognized', parser, note })
    return
  }
  updateLog(logId, { status: 'done', parser, note, results: executeAll(commands) })
}
