import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Mesh, Object3D, Vector3 } from 'three'
import { clickPart, partLabel, tickFeatures } from '../core/commands'
import { useCarStore } from '../core/store'
import { createDoorRig } from '../features/door/doorRig3d'
import { createLightRig } from '../features/light/lightRig3d'
import { createWindowRig } from '../features/window/windowRig3d'
import { createWiperRig } from '../features/wiper/wiperRig3d'
import type { CarProfile } from './carProfiles'
import { listMeshNames, normalizeCar } from './normalize'
import { findPartTag, samePart, type CarRig, type PartTag } from './partTag'

/** 按下与抬起之间的位移超过该像素数，视为拖拽视角而不是点击 */
const CLICK_MAX_DRAG_PX = 5

interface Props {
  profile: CarProfile
}

function buildCar(source: Object3D, profile: CarProfile) {
  const root = source.clone(true)
  normalizeCar(root, profile.length, profile.rotationY)
  root.traverse((o) => {
    const mesh = o as Mesh
    if (mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
  // 车窗要先于车门创建（车门高亮会跳过车窗玻璃）；更新时车门要先于车窗（车窗裁剪面跟随车门）
  const windowRig = createWindowRig(root, profile)
  const doorRig = createDoorRig(root, profile)
  const rigs: CarRig[] = [doorRig, windowRig, createLightRig(root, profile)]
  const wiperRig = createWiperRig(root, profile)
  if (wiperRig) rigs.push(wiperRig)
  return { root, rigs }
}

export function CarModel({ profile }: Props) {
  const { scene } = useGLTF(profile.url)
  const { root, rigs } = useMemo(() => buildCar(scene, profile), [scene, profile])

  useEffect(() => rigs.forEach((r) => r.mount?.()), [rigs])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    tickFeatures(dt)
    const state = useCarStore.getState()
    const now = performance.now()
    rigs.forEach((r) => r.update(state, dt, now))
  })

  const [hovered, setHoveredState] = useState<{ tag: PartTag; point: Vector3 }>()
  const hoveredRef = useRef<PartTag>()
  const setHovered = (tag?: PartTag, point?: Vector3) => {
    if (samePart(tag, hoveredRef.current)) return
    if (hoveredRef.current) rigs.forEach((r) => r.setHighlighted?.(hoveredRef.current!, false))
    if (tag) rigs.forEach((r) => r.setHighlighted?.(tag, true))
    hoveredRef.current = tag
    setHoveredState(tag && point ? { tag, point: point.clone() } : undefined)
    document.body.style.cursor = tag ? 'pointer' : ''
  }

  // 事件按命中距离由近到远派发，第一次回调就是离相机最近的 mesh
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(findPartTag(e.object), e.point)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta > CLICK_MAX_DRAG_PX) return
    const tag = findPartTag(e.object)
    if (tag) clickPart(tag)
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('debug')) {
      console.info(`[CarModel] ${profile.name} meshes:\n` + listMeshNames(root).join('\n'))
      Object.assign(window, { __carRoot: root, __carStore: useCarStore, __carRigs: rigs })
    }
  }, [root, rigs, profile])

  return (
    <>
      <primitive object={root} onPointerMove={onPointerMove} onPointerOut={() => setHovered(undefined)} onClick={onClick} />
      {hovered && (
        <Html position={hovered.point} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
          <PartTooltip tag={hovered.tag} />
        </Html>
      )}
    </>
  )
}

function PartTooltip({ tag }: { tag: PartTag }) {
  const label = useCarStore((s) => partLabel(tag, s))
  return label ? <div className="part-tooltip">{label}</div> : null
}
