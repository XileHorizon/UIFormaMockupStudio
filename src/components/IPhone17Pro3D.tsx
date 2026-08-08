import { Edges } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
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
  'space-black': '#303236',
  silver: '#c7c8c9',
  white: '#e3e1dc',
  gold: '#c89773',
  blue: '#547f9c',
  orange: '#d56f3d',
} as const

export default function IPhone17Pro3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const source = useLoader(OBJLoader, '/models/iphone-17-pro.obj')
  const texture = useScreenTexture(screenshot, screenshotType)

  const model = useMemo(() => {
    const next = source.clone(true)
    const ownedMaterials: THREE.Material[] = []
    const bodyColor = BODY_COLORS[device.color]

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true

      const names = (Array.isArray(child.material) ? child.material : [child.material])
        .map(material => material.name.toLowerCase())
        .join(' ')

      let material: THREE.Material
      if (names.includes('display') || names.includes('dynamic')) {
        material = new THREE.MeshBasicMaterial({ color: '#050506' })
      } else if (names.includes('cam') || names.includes('lidar') || names.includes('mic') || names.includes('warnex')) {
        material = new THREE.MeshPhysicalMaterial({ color: '#08090a', roughness: 0.16, metalness: 0.18, clearcoat: 0.65 })
      } else if (names.includes('torch')) {
        material = new THREE.MeshPhysicalMaterial({ color: '#fff1cd', emissive: '#5c492c', emissiveIntensity: 0.15, roughness: 0.22 })
      } else {
        material = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.86, roughness: device.materialPreset === 'matte' ? 0.66 : 0.3, clearcoat: 0.35 })
      }
      child.material = material
      ownedMaterials.push(material)
    })

    next.userData.ownedMaterials = ownedMaterials
    return next
  }, [device.color, device.materialPreset, source])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.08, 0.45]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotX),
        THREE.MathUtils.degToRad(transform.rotY),
        THREE.MathUtils.degToRad(transform.rotZ),
      ]}
      scale={transform.scale * 1.82}
      onPointerDown={event => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <primitive object={model} />

      <mesh position={[0, 0, 0.113]}>
        <planeGeometry args={[0.817, 2.39]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          color={new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness)}
        />
      </mesh>

      {device.showReflection && (
        <mesh position={[0, 0, 0.116]}>
          <planeGeometry args={[0.817, 2.39]} />
          <meshPhysicalMaterial transparent opacity={0.055} color="#dcecff" roughness={0.04} depthWrite={false} />
        </mesh>
      )}

      {selected && (
        <mesh>
          <boxGeometry args={[0.98, 2.82, 0.28]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#3b7ef8" />
        </mesh>
      )}
    </group>
  )
}

useLoader.preload(OBJLoader, '/models/iphone-17-pro.obj')
