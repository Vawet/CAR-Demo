import { includesAny, pickEarliest } from '../../voice/intent/ruleUtils'
import type { WindowAction, WindowCommand, WindowId } from './windowTypes'

const DOMAIN_WORDS = ['车窗', '窗户', '窗子', '窗', '玻璃']

// 车窗语境下「降下」等于打开，「升起」等于关闭
const OPEN_WORDS = ['打开', '开启', '开一下', '降下', '降低', '落下', '放下', '摇下', '降', '落', '开']
const CLOSE_WORDS = ['关闭', '关上', '关掉', '关一下', '升起', '升上', '摇上', '合上', '升', '关']

const TARGET_WORDS: Array<[string[], WindowId[]]> = [
  [['主驾', '驾驶位', '驾驶座', '驾驶员', '司机', '左前'], ['frontLeft']],
  [['副驾', '乘客', '右前'], ['frontRight']],
  [['左后'], ['rearLeft']],
  [['右后'], ['rearRight']],
  [['前排', '前面', '前边', '前座'], ['frontLeft', 'frontRight']],
  [['后排', '后面', '后边', '后座'], ['rearLeft', 'rearRight']],
  [['左边', '左侧', '左面'], ['frontLeft', 'rearLeft']],
  [['右边', '右侧', '右面'], ['frontRight', 'rearRight']],
]

const CN_DIGITS: Record<string, number> = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

/**
 * 解析一个子句中的车窗指令；不是车窗相关的句子返回 null。
 * inheritDomain 为 true 时表示上一子句已经在说车窗，本句可以省略「车窗」二字。
 */
export function parseWindowIntent(clause: string, inheritDomain = false): WindowCommand[] | null {
  if (!inheritDomain && !includesAny(clause, DOMAIN_WORDS)) return null

  const action = detectAction(clause)
  if (!action) return null

  const value = detectOpenness(clause)
  const targets = detectSeatTargets(clause)
  const finalAction: WindowAction = value !== undefined ? 'set' : action

  return targets.map((target) => ({
    domain: 'window',
    action: finalAction,
    target,
    ...(finalAction === 'set' ? { value } : {}),
  }))
}

function detectAction(text: string) {
  return pickEarliest(text, { open: OPEN_WORDS, close: CLOSE_WORDS })
}

/** 识别座位方位（主驾、副驾、后排、左边……），车窗和车门共用；没有提到时返回 all */
export function detectSeatTargets(text: string): Array<WindowId | 'all'> {
  if (/全部|所有|四个|全都|都/.test(text)) return ['all']
  const found = new Set<WindowId>()
  for (const [words, ids] of TARGET_WORDS) {
    if (words.some((w) => text.includes(w))) ids.forEach((id) => found.add(id))
  }
  return found.size ? [...found] : ['all']
}

/** 识别开度：一半、一点、百分之三十、30% 等；没有提到开度时返回 undefined */
function detectOpenness(text: string): number | undefined {
  if (/一半|半开|开半/.test(text)) return 0.5
  if (/一点|一条缝|留个缝|一些|透透气/.test(text)) return 0.2

  const percent = text.match(/(\d{1,3})\s*%/) ?? text.match(/百分之(\d{1,3})/)
  if (percent) return clampPercent(Number(percent[1]))

  const cnPercent = text.match(/百分之([零一二两三四五六七八九十百]+)/)
  if (cnPercent) {
    const n = parseChineseNumber(cnPercent[1])
    if (n !== undefined) return clampPercent(n)
  }
  return undefined
}

function clampPercent(n: number) {
  return Math.min(100, Math.max(0, n)) / 100
}

/** 支持 0~100 的中文数字，例如「三十」「七十五」「十」「一百」 */
export function parseChineseNumber(s: string): number | undefined {
  if (s === '一百' || s === '百') return 100
  const m = s.match(/^([一二两三四五六七八九])?(十)?([一二三四五六七八九])?$/)
  if (!m || (!m[1] && !m[2] && !m[3])) return undefined
  if (!m[2]) return m[3] ? undefined : CN_DIGITS[m[1]]
  return (m[1] ? CN_DIGITS[m[1]] : 1) * 10 + (m[3] ? CN_DIGITS[m[3]] : 0)
}
