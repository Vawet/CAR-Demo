import { includesAny, pickEarliest } from '../../voice/intent/ruleUtils'
import { detectSeatTargets } from '../window/windowIntents'
import type { DoorCommand, LockCommand } from './doorTypes'

const DOOR_WORDS = ['车门', '门']
const DOOR_ACTIONS = {
  open: ['打开', '开启', '拉开', '推开', '抬起', '升起', '开'],
  close: ['关闭', '关上', '关掉', '合上', '放下', '落下', '关'],
}

export function parseDoorIntent(clause: string, inheritDomain = false): DoorCommand[] | null {
  if (!inheritDomain && !includesAny(clause, DOOR_WORDS)) return null
  const action = pickEarliest(clause, DOOR_ACTIONS)
  if (!action) return null
  return detectSeatTargets(clause).map((target) => ({ domain: 'door', action, target }))
}

const LOCK_ACTIONS = {
  unlock: ['解锁', '开锁', '解开', '打开门锁', '打开车锁', '解除锁'],
  lock: ['上锁', '锁上', '锁车', '锁门', '落锁', '锁定', '锁了', '锁好', '锁住', '锁一下'],
}

export function parseLockIntent(clause: string): LockCommand[] | null {
  if (!clause.includes('锁')) return null
  const action = pickEarliest(clause, LOCK_ACTIONS)
  return action ? [{ domain: 'lock', action }] : null
}
