import type { CarCommand, CommandDomain } from '../core/commandTypes'
import type { FeatureModule } from '../core/feature'
import { doorModule, lockModule } from './door'
import { lightModule } from './light'
import { sceneModule } from './scene'
import { windowModule } from './window'
import { wiperModule } from './wiper'

type Registry = { [D in CommandDomain]: FeatureModule<Extract<CarCommand, { domain: D }>> }

/**
 * 所有车控能力的注册表。规则解析按此顺序尝试：
 * 门锁要排在车门前面，否则「锁上车门」会被当成关车门。
 */
const registry: Registry = {
  window: windowModule,
  lock: lockModule,
  door: doorModule,
  light: lightModule,
  wiper: wiperModule,
  scene: sceneModule,
}

export function getFeature(domain: CommandDomain): FeatureModule<CarCommand> | undefined {
  return registry[domain] as FeatureModule<CarCommand> | undefined
}

export function allFeatures(): FeatureModule<CarCommand>[] {
  return Object.values(registry) as FeatureModule<CarCommand>[]
}
