import { Environment, Lightformer } from '@react-three/drei'
import { useCarStore } from '../core/store'

const DAY = { background: '#15171c', ambient: 0.25, sun: 1.6, sunColor: '#ffffff', env: 1 }
const NIGHT = { background: '#05070b', ambient: 0.08, sun: 0.25, sunColor: '#8fa8ff', env: 0.18 }

/** 纯程序化的影棚环境光，不依赖外部 HDR 文件；夜间模式下整体压暗，突出车灯 */
export function Lighting() {
  const night = useCarStore((s) => s.night)
  const p = night ? NIGHT : DAY

  return (
    <>
      <color attach="background" args={[p.background]} />
      <ambientLight intensity={p.ambient} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={p.sun}
        color={p.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <Environment resolution={256} frames={1} environmentIntensity={p.env}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 2, -8]} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={1.5} position={[0, 3, 8]} scale={3} />
      </Environment>
    </>
  )
}
