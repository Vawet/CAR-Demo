import type { FeatureModule } from '../../core/feature'
import { useCarStore } from '../../core/store'
import { describeWindowState, validateWindowCommand, WINDOW_AI_SPEC } from './windowAi'
import { describeWindowCommand, executeWindowCommand } from './windowCommands'
import { parseWindowIntent } from './windowIntents'
import { WINDOW_LABELS, type WindowCommand, type WindowId } from './windowTypes'

export const windowModule: FeatureModule<WindowCommand> = {
  domain: 'window',
  execute: executeWindowCommand,
  describe: describeWindowCommand,
  tick: (dt) => useCarStore.getState().tickWindows(dt),
  rules: { parse: parseWindowIntent },
  ai: { spec: WINDOW_AI_SPEC, describeState: describeWindowState, validate: validateWindowCommand },
  part: {
    label: (tag, state) => {
      const id = tag.id as WindowId
      return `${WINDOW_LABELS[id]}车窗 · 点击${state.windows[id].target > 0 ? '关闭' : '打开'}`
    },
    click: (tag) => ({ domain: 'window', action: 'toggle', target: tag.id as WindowId }),
  },
}
