import type { CarCommand } from '../../core/commandTypes'
import type { FeatureModule } from '../../core/feature'
import { allFeatures } from '../../features/registry'

const CLAUSE_SEPARATORS = /[，,。.;；！!？?]+|然后|再把|并且|同时|接着/

/** 把一句话拆成子句，逐句交给各能力解析，合并结果 */
export function parseByRules(text: string): CarCommand[] {
  const features = allFeatures()
  const commands: CarCommand[] = []
  let last: FeatureModule<CarCommand> | undefined
  const clauses = text.replace(/\s+/g, '').split(CLAUSE_SEPARATORS).filter(Boolean)

  for (const clause of clauses) {
    const matched =
      features.find((f) => tryParse(f, clause, false, commands)) ??
      (last && tryParse(last, clause, true, commands) ? last : undefined)
    if (matched) last = matched
  }
  return commands
}

function tryParse(feature: FeatureModule<CarCommand>, clause: string, inherit: boolean, out: CarCommand[]) {
  const result = feature.rules.parse(clause, inherit)
  if (!result?.length) return false
  out.push(...result)
  return true
}
