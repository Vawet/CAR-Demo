import { allFeatures, getFeature } from '../features/registry'
import type { CarCommand, CommandResult } from './commandTypes'
import type { PartTag } from './feature'
import type { LogEntry, LogSource } from './logSlice'
import { useCarStore, type CarState } from './store'

export function dispatchCommand(cmd: CarCommand): CommandResult {
  const feature = getFeature(cmd.domain)
  if (!feature) return { ok: false, message: `不支持的指令类型：${cmd.domain}` }
  return feature.execute(cmd)
}

export function describeCommand(cmd: CarCommand): string {
  return getFeature(cmd.domain)?.describe(cmd) ?? JSON.stringify(cmd)
}

export function executeAll(commands: CarCommand[]): LogEntry['results'] {
  return commands.map((command) => ({ command, ...dispatchCommand(command) }))
}

/** 执行一组指令并写入日志（点击、面板按钮使用） */
export function runCommands(commands: CarCommand[], source: LogSource) {
  const results = executeAll(commands)
  useCarStore.getState().addLog({ source, status: 'done', results })
  return results
}

export function tickFeatures(dt: number) {
  for (const f of allFeatures()) f.tick?.(dt)
}

export function partLabel(tag: PartTag, state: CarState = useCarStore.getState()): string | undefined {
  return getFeature(tag.domain)?.part?.label(tag, state)
}

export function clickPart(tag: PartTag) {
  const command = getFeature(tag.domain)?.part?.click(tag, useCarStore.getState())
  if (command) runCommands([command], 'click')
}
