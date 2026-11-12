import { describe, expect, it } from 'vitest'
import { validateWindowCommand } from './windowAi'

describe('validateWindowCommand', () => {
  it('接受合法指令', () => {
    expect(validateWindowCommand({ domain: 'window', action: 'open', target: 'frontLeft' })).toEqual({
      domain: 'window',
      action: 'open',
      target: 'frontLeft',
    })
  })

  it('set 指令会把开度限制在 0~1', () => {
    expect(validateWindowCommand({ domain: 'window', action: 'set', target: 'all', value: 1.8 })).toEqual({
      domain: 'window',
      action: 'set',
      target: 'all',
      value: 1,
    })
  })

  it.each([
    [{ action: 'explode', target: 'all' }],
    [{ action: 'open', target: 'roof' }],
    [{ action: 'set', target: 'frontLeft' }],
    [{ action: 'set', target: 'frontLeft', value: '50%' }],
  ])('拒绝非法指令 %j', (raw) => {
    expect(validateWindowCommand(raw)).toBeNull()
  })
})
