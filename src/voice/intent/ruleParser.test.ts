import { describe, expect, it } from 'vitest'
import { parseChineseNumber } from '../../features/window/windowIntents'
import { parseByRules } from './ruleParser'

const win = (action: string, target: string, value?: number) => ({
  domain: 'window',
  action,
  target,
  ...(value !== undefined ? { value } : {}),
})

describe('parseByRules', () => {
  it.each([
    ['打开车窗', [win('open', 'all')]],
    ['关闭车窗', [win('close', 'all')]],
    ['把车窗降下来', [win('open', 'all')]],
    ['把窗户升起来', [win('close', 'all')]],
    ['关上所有车窗', [win('close', 'all')]],
    ['打开主驾车窗', [win('open', 'frontLeft')]],
    ['副驾的窗户关一下', [win('close', 'frontRight')]],
    ['打开后排车窗', [win('open', 'rearLeft'), win('open', 'rearRight')]],
    ['主驾和副驾车窗打开', [win('open', 'frontLeft'), win('open', 'frontRight')]],
    ['车窗开一半', [win('set', 'all', 0.5)]],
    ['主驾车窗打开百分之三十', [win('set', 'frontLeft', 0.3)]],
    ['左前车窗开到 75%', [win('set', 'frontLeft', 0.75)]],
    ['打开主驾车窗，关闭副驾', [win('open', 'frontLeft'), win('close', 'frontRight')]],
    ['打开主驾车窗然后关闭副驾车窗', [win('open', 'frontLeft'), win('close', 'frontRight')]],
  ])('%s', (text, expected) => {
    expect(parseByRules(text)).toEqual(expected)
  })

  it.each(['今天天气怎么样', '打开空调', '车窗'])('无法识别：%s', (text) => {
    expect(parseByRules(text)).toEqual([])
  })
})

describe('parseChineseNumber', () => {
  it.each([
    ['五', 5],
    ['十', 10],
    ['十五', 15],
    ['三十', 30],
    ['七十五', 75],
    ['一百', 100],
  ])('%s -> %d', (s, n) => {
    expect(parseChineseNumber(s)).toBe(n)
  })
})
