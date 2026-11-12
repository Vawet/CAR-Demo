import type { StateCreator } from 'zustand'
import type { CarCommand, CommandResult } from './commandTypes'

export type LogSource = 'voice' | 'text' | 'click' | 'panel'
export type ParserKind = 'rule' | 'ai' | 'ai-fallback'

export interface LogEntry {
  id: number
  time: number
  source: LogSource
  /** 语音识别文本或手动输入的文本 */
  input?: string
  parser?: ParserKind
  /** AI 的补充说明或回退原因 */
  note?: string
  status: 'pending' | 'done' | 'unrecognized'
  results: Array<{ command: CarCommand } & CommandResult>
}

export interface LogSlice {
  logs: LogEntry[]
  addLog: (entry: Omit<LogEntry, 'id' | 'time'>) => number
  updateLog: (id: number, patch: Partial<Omit<LogEntry, 'id' | 'time'>>) => void
  clearLogs: () => void
}

const MAX_LOGS = 100
let nextId = 1

export const createLogSlice: StateCreator<LogSlice, [], [], LogSlice> = (set) => ({
  logs: [],
  addLog: (entry) => {
    const id = nextId++
    set((s) => ({ logs: [{ ...entry, id, time: Date.now() }, ...s.logs].slice(0, MAX_LOGS) }))
    return id
  },
  updateLog: (id, patch) =>
    set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  clearLogs: () => set({ logs: [] }),
})
