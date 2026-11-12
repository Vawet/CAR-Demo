import type { CarProfile } from '../car/carProfiles'
import { runCommands } from '../core/commands'
import { useCarStore } from '../core/store'
import { AiSettingsCard } from './AiSettingsCard'
import { DoorCard } from './DoorCard'
import { LightCard } from './LightCard'
import { VoiceControl } from './VoiceControl'
import { VoiceLog } from './VoiceLog'
import { WindowStatusCard } from './WindowStatusCard'

interface Props {
  profile: CarProfile
}

export function ControlPanel({ profile }: Props) {
  const night = useCarStore((s) => s.night)

  return (
    <aside className="panel">
      <div className="panel-title">
        <div>
          <h2>车辆控制</h2>
          <span className="muted">{profile.name}</span>
        </div>
        <div className="segmented compact">
          <button className={night ? '' : 'active'} onClick={() => runCommands([{ domain: 'scene', action: 'day' }], 'panel')}>
            白天
          </button>
          <button className={night ? 'active' : ''} onClick={() => runCommands([{ domain: 'scene', action: 'night' }], 'panel')}>
            夜间
          </button>
        </div>
      </div>
      <p className="hint">提示：车模上的车门、车窗、车灯、雨刷都可以直接点击。</p>
      <WindowStatusCard />
      <DoorCard />
      <LightCard />
      <VoiceControl />
      <AiSettingsCard />
      <VoiceLog />
    </aside>
  )
}
