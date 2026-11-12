import { describe, expect, it } from 'vitest'
import { parseByRules } from './ruleParser'

describe('车门与门锁', () => {
  it.each([
    ['打开车门', [{ domain: 'door', action: 'open', target: 'all' }]],
    ['开一下主驾车门', [{ domain: 'door', action: 'open', target: 'frontLeft' }]],
    ['关上副驾的门', [{ domain: 'door', action: 'close', target: 'frontRight' }]],
    ['锁车', [{ domain: 'lock', action: 'lock' }]],
    ['把车门锁上', [{ domain: 'lock', action: 'lock' }]],
    ['解锁车辆', [{ domain: 'lock', action: 'unlock' }]],
    ['打开门锁', [{ domain: 'lock', action: 'unlock' }]],
  ])('%s', (text, expected) => {
    expect(parseByRules(text)).toEqual(expected)
  })
})

describe('车灯', () => {
  it.each([
    ['打开大灯', [{ domain: 'light', action: 'on', target: 'headlight' }]],
    ['开远光', [{ domain: 'light', action: 'on', target: 'headlight' }]],
    ['关闭尾灯', [{ domain: 'light', action: 'off', target: 'taillight' }]],
    ['打开双闪', [{ domain: 'light', action: 'on', target: 'hazard' }]],
    ['打左转向灯', [{ domain: 'light', action: 'on', target: 'leftTurn' }]],
    ['右转向', [{ domain: 'light', action: 'on', target: 'rightTurn' }]],
    ['关掉双闪', [{ domain: 'light', action: 'off', target: 'hazard' }]],
    ['开灯', [{ domain: 'light', action: 'on', target: 'all' }]],
    ['把车灯都关了', [{ domain: 'light', action: 'off', target: 'all' }]],
    [
      '打开大灯和尾灯',
      [
        { domain: 'light', action: 'on', target: 'headlight' },
        { domain: 'light', action: 'on', target: 'taillight' },
      ],
    ],
  ])('%s', (text, expected) => {
    expect(parseByRules(text)).toEqual(expected)
  })
})

describe('雨刷', () => {
  it.each([
    ['打开雨刷', 'low'],
    ['雨刷快一点', 'high'],
    ['打开雨刮器调到高速', 'high'],
    ['雨刷刮一下', 'once'],
    ['关闭雨刷', 'off'],
    ['雨刷停下', 'off'],
  ])('%s', (text, action) => {
    expect(parseByRules(text)).toEqual([{ domain: 'wiper', action }])
  })
})

describe('场景与组合指令', () => {
  it('切换到夜间模式', () => {
    expect(parseByRules('切换到夜间模式')).toEqual([{ domain: 'scene', action: 'night' }])
  })

  it('跨能力的多条指令', () => {
    expect(parseByRules('打开车门，然后打开大灯，再把雨刷关了')).toEqual([
      { domain: 'door', action: 'open', target: 'all' },
      { domain: 'light', action: 'on', target: 'headlight' },
      { domain: 'wiper', action: 'off' },
    ])
  })

  it('车窗与车门互不干扰', () => {
    expect(parseByRules('打开车窗')).toEqual([{ domain: 'window', action: 'open', target: 'all' }])
    expect(parseByRules('打开车门')).toEqual([{ domain: 'door', action: 'open', target: 'all' }])
  })
})
