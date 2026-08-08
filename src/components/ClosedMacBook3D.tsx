import { Edges, useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { DeviceConfig, ScreenContentType, Transform } from '../types'
import { useScreenTexture } from './StudioMonitor3D'

interface Props {
  device: DeviceConfig
  transform: Transform
  screenshot: string | null
  screenshotType: ScreenContentType
  selected: boolean
  onSelect: () => void
}

const BODY_COLORS = {
  'space-black': '#242629',
  silver: '#b9bcc0',
  white: '#d9dadd',
  gold: '#bda17d',
  blue: '#718da5',
  orange: '#c9794f',
} as const

const normalizedName = (name: string) => name.toLowerCase().replace(/[._\s-]/g, '')

export default function ClosedMacBook3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const { scene } = useGLTF('/models/macbook-open.glb', false, false)
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 5.72 / 3.72 })
  const bodyColor = BODY_COLORS[device.color]
  const bodyRoughness = device.materialPreset === 'matte' ? 0.62 : 0.38

  const model = useMemo(() => {
    const next = scene.clone(true)
    const ownedMaterials: THREE.Material[] = []
    const own = (material: THREE.Material) => {
      ownedMaterials.push(material)
      return material
    }

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
      const name = normalizedName(child.name)

      if (name === 'screen') {
        child.material = own(new THREE.MeshBasicMaterial({ color: '#050609', side: THREE.DoubleSide }))
      } else if (name.includes('keyboardkeys')) {
        child.material = own(new THREE.MeshPhysicalMaterial({ color: '#111317', metalness: 0.03, roughness: 0.52, clearcoat: 0.08, envMapIntensity: 0.45 }))
      } else if (name.includes('keyboardbase')) {
        child.material = own(new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.72, roughness: bodyRoughness + 0.08, clearcoat: 0.06, envMapIntensity: 0.52 }))
      } else if (name.includes('trackpad')) {
        child.material = own(new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.62, roughness: bodyRoughness + 0.04, clearcoat: 0.08, envMapIntensity: 0.5 }))
      } else if (name.includes('foot')) {
        child.material = own(new THREE.MeshStandardMaterial({ color: '#121316', metalness: 0.02, roughness: 0.9 }))
      } else if (name.includes('apple')) {
        child.material = own(new THREE.MeshPhysicalMaterial({ color: '#d7d9dc', metalness: 0.88, roughness: 0.23, clearcoat: 0.12, envMapIntensity: 0.55 }))
      } else {
        child.material = own(new THREE.MeshPhysicalMaterial({
          color: bodyColor,
          metalness: 0.8,
          roughness: bodyRoughness,
          clearcoat: 0.06,
          clearcoatRoughness: 0.38,
          envMapIntensity: 0.5,
          side: THREE.DoubleSide,
        }))
      }
    })

    next.userData.ownedMaterials = ownedMaterials
    return next
  }, [bodyColor, bodyRoughness, scene])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 1.9, 0.7]}
      rotation={[THREE.MathUtils.degToRad(transform.rotX), THREE.MathUtils.degToRad(transform.rotY), THREE.MathUtils.degToRad(transform.rotZ)]}
      scale={transform.scale}
      onPointerDown={event => { event.stopPropagation(); onSelect() }}
    >
      <group scale={0.9}>
        <primitive object={model} dispose={null} scale={0.0202} />

        <mesh position={[0, 2.42, -2.22]} rotation={[THREE.MathUtils.degToRad(-10), 0, 0]}>
          <planeGeometry args={[5.72, 3.72]} />
          <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} color={new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness)} />
        </mesh>
        {device.showReflection && (
          <mesh position={[0, 2.423, -2.205]} rotation={[THREE.MathUtils.degToRad(-10), 0, 0]}>
            <planeGeometry args={[5.72, 3.72]} />
            <meshPhysicalMaterial transparent opacity={0.035} color="#dcecff" roughness={0.08} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {selected && (
          <mesh position={[0, 2.18, 0]}>
            <boxGeometry args={[6.25, 4.55, 4.9]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges color="#3b7ef8" />
          </mesh>
        )}
      </group>
    </group>
  )
}

useGLTF.preload('/models/macbook-open.glb', false, false)
