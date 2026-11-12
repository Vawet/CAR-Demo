import type { FeatureModule } from '../../core/feature'
import { useCarStore } from '../../core/store'
import { pickEarliest } from '../../voice/intent/ruleUtils'
import type { SceneCommand } from './sceneSlice'

const SCENE_ACTIONS = {
  night: ['夜间', '夜晚', '黑夜', '夜景', '天黑', '晚上模式', '晚上场景'],
  day: ['白天', '日间', '天亮', '白昼'],
}

export const sceneModule: FeatureModule<SceneCommand> = {
  domain: 'scene',
  execute: (cmd) => {
    const { night, setNight } = useCarStore.getState()
    const next = cmd.action === 'toggle' ? !night : cmd.action === 'night'
    setNight(next)
    return { ok: true, message: next === night ? `已经是${next ? '夜间' : '白天'}场景` : `已切换到${next ? '夜间' : '白天'}场景` }
  },
  describe: (cmd) => ({ day: '切换到白天', night: '切换到夜间', toggle: '切换昼夜' })[cmd.action],
  rules: {
    parse: (clause) => {
      const action = pickEarliest(clause, SCENE_ACTIONS)
      return action ? [{ domain: 'scene', action }] : null
    },
  },
  ai: {
    spec: `演示场景指令 domain="scene"（不是车控，而是切换 3D 场景的昼夜，方便观察车灯）：
- action: "day" | "night" | "toggle"`,
    describeState: (s) => `场景：${s.night ? '夜间' : '白天'}`,
    validate: (raw) =>
      raw.action === 'day' || raw.action === 'night' || raw.action === 'toggle' ? { domain: 'scene', action: raw.action } : null,
  },
}
