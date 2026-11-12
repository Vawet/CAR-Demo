import { Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bvh, ContactShadows, OrbitControls } from '@react-three/drei'
import { Lighting } from './Lighting'

interface Props {
  children: ReactNode
}

const DEFAULT_CAMERA: [number, number, number] = [5.5, 2.2, 5.5]

/** 开发调试用：?cam=x,y,z 指定初始相机位置 */
function initialCameraPosition(): [number, number, number] {
  const values = new URLSearchParams(window.location.search).get('cam')?.split(',').map(Number)
  return values?.length === 3 && values.every(Number.isFinite) ? (values as [number, number, number]) : DEFAULT_CAMERA
}

export function CarCanvas({ children }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: initialCameraPosition(), fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <Lighting />
      <Suspense fallback={null}>
        <Bvh>{children}</Bvh>
      </Suspense>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={12} blur={2.4} far={3} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.002} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#1d2027" roughness={0.85} metalness={0} envMapIntensity={0.15} />
      </mesh>
      <OrbitControls
        makeDefault
        target={[0, 0.7, 0]}
        enableDamping
        minDistance={2.5}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  )
}
