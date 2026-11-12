import type { CommandResult } from '../../core/commandTypes'
import type { FeatureModule } from '../../core/feature'
import { useCarStore } from '../../core/store'
import { doorStatusLabel } from './doorSlice'
import { parseDoorIntent, parseLockIntent } from './doorIntents'
import { DOOR_IDS, DOOR_LABELS, type DoorCommand, type DoorId, type LockCommand } from './doorTypes'

const doorName = (target: DoorId | 'all') => (target === 'all' ? '全部车门' : `${DOOR_LABELS[target]}车门`)

function executeDoor(cmd: DoorCommand): CommandResult {
  const { availableDoors, doors, locked, setDoorTarget } = useCarStore.getState()
  if (cmd.target !== 'all' && !availableDoors.includes(cmd.target)) {
    return { ok: false, message: `当前车型没有${doorName(cmd.target)}` }
  }
  const ids = cmd.target === 'all' ? availableDoors : [cmd.target]
  if (!ids.length) return { ok: false, message: '当前车型没有可控制的车门' }

  const target = cmd.action === 'toggle' ? (ids.some((id) => doors[id].target > 0) ? 0 : 1) : cmd.action === 'open' ? 1 : 0
  if (target === 1 && locked) return { ok: false, message: '车辆已上锁，请先解锁' }

  const already = ids.every((id) => doors[id].position === target && doors[id].target === target)
  ids.forEach((id) => setDoorTarget(id, target))
  const what = target ? '打开' : '关闭'
  return { ok: true, message: already ? `${doorName(cmd.target)}已经是${what}状态` : `正在${what}${doorName(cmd.target)}` }
}

export const doorModule: FeatureModule<DoorCommand> = {
  domain: 'door',
  execute: executeDoor,
  describe: (cmd) => `${{ open: '打开', close: '关闭', toggle: '切换' }[cmd.action]}${doorName(cmd.target)}`,
  tick: (dt) => useCarStore.getState().tickDoors(dt),
  rules: { parse: parseDoorIntent },
  ai: {
    spec: `车门指令 domain="door"（蝴蝶门，向前上方抬起）：
- action: "open" | "close" | "toggle"
- target: 与车窗相同的 "frontLeft" | "frontRight" | "rearLeft" | "rearRight" | "all"
车辆上锁时无法开门，需要先发出解锁指令。`,
    describeState: (s) =>
      '车门状态：\n' +
      DOOR_IDS.map((id) =>
        s.availableDoors.includes(id) ? `- ${id}（${DOOR_LABELS[id]}）：${doorStatusLabel(s.doors[id])}` : `- ${id}：当前车型没有该车门`,
      ).join('\n'),
    validate: (raw) => {
      const { action, target } = raw
      if (action !== 'open' && action !== 'close' && action !== 'toggle') return null
      if (target !== 'all' && !DOOR_IDS.includes(target as DoorId)) return null
      return { domain: 'door', action, target: target as DoorId | 'all' }
    },
  },
  part: {
    label: (tag, s) => {
      const id = tag.id as DoorId
      if (s.locked) return `${DOOR_LABELS[id]}车门 · 已上锁`
      return `${DOOR_LABELS[id]}车门 · 点击${s.doors[id].target > 0 ? '关闭' : '打开'}`
    },
    click: (tag) => ({ domain: 'door', action: 'toggle', target: tag.id as DoorId }),
  },
}

function executeLock(cmd: LockCommand): CommandResult {
  const { locked, doors, availableDoors, setLocked, flash } = useCarStore.getState()
  const lock = cmd.action === 'toggle' ? !locked : cmd.action === 'lock'
  if (lock === locked) return { ok: true, message: lock ? '车辆已经是上锁状态' : '车辆已经是解锁状态' }
  if (lock && availableDoors.some((id) => doors[id].target > 0)) {
    return { ok: false, message: '有车门未关闭，请先关闭车门再上锁' }
  }
  setLocked(lock)
  flash(lock ? 1 : 2)
  return { ok: true, message: lock ? '已上锁，双闪一次' : '已解锁，双闪两次' }
}

export const lockModule: FeatureModule<LockCommand> = {
  domain: 'lock',
  execute: executeLock,
  describe: (cmd) => ({ lock: '上锁', unlock: '解锁', toggle: '切换门锁' })[cmd.action],
  rules: { parse: parseLockIntent },
  ai: {
    spec: `门锁指令 domain="lock"：
- action: "lock" 上锁 | "unlock" 解锁 | "toggle"
有车门未关闭时无法上锁，需要先关闭车门。`,
    describeState: (s) => `门锁：${s.locked ? '已上锁' : '未上锁'}`,
    validate: (raw) =>
      raw.action === 'lock' || raw.action === 'unlock' || raw.action === 'toggle' ? { domain: 'lock', action: raw.action } : null,
  },
}
