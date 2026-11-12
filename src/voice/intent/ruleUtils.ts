/** 返回 text 中最早出现的词的位置，没有则返回 -1 */
export function firstIndex(text: string, words: string[]) {
  const indices = words.map((w) => text.indexOf(w)).filter((i) => i >= 0)
  return indices.length ? Math.min(...indices) : -1
}

export function includesAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w))
}

/**
 * 在多组动作词中取最早出现的一组。
 * 例如「打开」里的「开」与后面的「关」同时出现时，以先出现的为准。
 */
export function pickEarliest<K extends string>(text: string, groups: Record<K, string[]>): K | null {
  let best: K | null = null
  let bestIndex = Infinity
  for (const key of Object.keys(groups) as K[]) {
    const index = firstIndex(text, groups[key])
    if (index >= 0 && index < bestIndex) {
      best = key
      bestIndex = index
    }
  }
  return best
}
