import { useMemo, useState } from 'react'
import { CarCanvas } from '../scene/CarCanvas'
import { ModelErrorBoundary } from '../scene/ModelErrorBoundary'
import { CarModel } from '../car/CarModel'
import { resolveProfile } from '../car/carProfiles'
import { ControlPanel } from '../ui/ControlPanel'
import { LoadingOverlay } from '../ui/LoadingOverlay'

export function App() {
  const profile = useMemo(resolveProfile, [])
  const [loadError, setLoadError] = useState<Error>()
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className={`layout ${panelOpen ? '' : 'panel-collapsed'}`}>
      <main className="stage">
        <CarCanvas>
          <ModelErrorBoundary onError={setLoadError}>
            <CarModel profile={profile} />
          </ModelErrorBoundary>
        </CarCanvas>
        <LoadingOverlay />
        {loadError && (
          <div className="overlay">
            <div className="overlay-box error">
              <strong>车模加载失败</strong>
              <p>
                请确认模型文件 <code>public{profile.url}</code> 存在且是有效的 glb 文件。
              </p>
              <p className="muted">{loadError.message}</p>
            </div>
          </div>
        )}
        <footer className="attribution">
          模型：
          <a href={profile.attribution.url} target="_blank" rel="noreferrer">
            {profile.attribution.title}
          </a>{' '}
          by {profile.attribution.author}（{profile.attribution.license}）
        </footer>
        <button className="btn panel-toggle" onClick={() => setPanelOpen((v) => !v)}>
          {panelOpen ? '收起面板' : '展开面板'}
        </button>
      </main>
      <ControlPanel profile={profile} />
    </div>
  )
}
