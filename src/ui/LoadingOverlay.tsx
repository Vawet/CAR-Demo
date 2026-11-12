import { useProgress } from '@react-three/drei'

export function LoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="overlay">
      <div className="overlay-box">
        <div>正在加载车模… {Math.round(progress)}%</div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
