import { useCarStore } from '../../core/store'
import type { CommandResult } from '../../core/commandTypes'
import { WINDOW_LABELS, type WindowCommand, type WindowId } from './windowTypes'

const ACTION_LABELS = { open: '打开', close: '关闭', toggle: '切换', set: '调节' } as const

export function describeWindowCommand(cmd: WindowCommand): string {
  const who = cmd.target === 'all' ? '全部车窗' : `${WINDOW_LABELS[cmd.target]}车窗`
  const value = cmd.action === 'set' ? ` 至 ${Math.round((cmd.value ?? 1) * 100)}%` : ''
  return `${ACTION_LABELS[cmd.action]}${who}${value}`
}

export function executeWindowCommand(cmd: WindowCommand): CommandResult {
  const { availableWindows, windows, setWindowTarget } = useCarStore.getState()

  if (cmd.target !== 'all' && !availableWindows.includes(cmd.target)) {
    return { ok: false, message: `当前车型没有${WINDOW_LABELS[cmd.target]}车窗` }
  }
  const ids: WindowId[] = cmd.target === 'all' ? availableWindows : [cmd.target]
  if (ids.length === 0) return { ok: false, message: '当前车型没有可控制的车窗' }

  let target: number
  switch (cmd.action) {
    case 'open':
      target = 1
      break
    case 'close':
      target = 0
      break
    case 'set':
      target = cmd.value ?? 1
      break
    case 'toggle': {
      const anyOpen = ids.some((id) => windows[id].target > 0)
      target = anyOpen ? 0 : 1
      break
    }
  }

  const alreadyThere = ids.every((id) => windows[id].position === target && windows[id].target === target)
  ids.forEach((id) => setWindowTarget(id, target))

  const who = cmd.target === 'all' ? '全部车窗' : `${WINDOW_LABELS[cmd.target]}车窗`
  if (target === 0 || target === 1) {
    const what = target === 0 ? '关闭' : '打开'
    return { ok: true, message: alreadyThere ? `${who}已经是${what}状态` : `正在${what}${who}` }
  }
  const percent = `${Math.round(target * 100)}%`
  return { ok: true, message: alreadyThere ? `${who}已经开到 ${percent}` : `正在将${who}调节到 ${percent}` }
}
