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
  'space-black': '#292b2e',
  silver: '#c9cbcd',
  white: '#e4e5e5',
  gold: '#c7a981',
} as const

function addPlanarScreenUvs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox
  const positions = geometry.getAttribute('position')
  if (!bounds || !positions) return

  const width = bounds.max.x - bounds.min.x
  const height = bounds.max.y - bounds.min.y
  const uv = new Float32Array(positions.count * 2)

  for (let index = 0; index < positions.count; index += 1) {
    uv[index * 2] = (positions.getX(index) - bounds.min.x) / width
    uv[index * 2 + 1] = (positions.getY(index) - bounds.min.y) / height
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

export default function ClosedMacBook3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const { scene } = useGLTF('/models/macbook-open.glb', false, false)
  const texture = useScreenTexture(screenshot, screenshotType)
  const bodyColor = BODY_COLORS[device.color]
  const roughness = device.materialPreset === 'matte' ? 0.5 : 0.24

  const model = useMemo(() => {
    const next = scene.clone(true)
    const ownedGeometries: THREE.BufferGeometry[] = []
    const ownedMaterials: THREE.Material[] = []

    const material = (value: THREE.Material) => {
      ownedMaterials.push(value)
      return value
    }

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return

      child.castShadow = true
      child.receiveShadow = true

      if (child.name === 'Screen') {
        child.geometry = child.geometry.clone()
        ownedGeometries.push(child.geometry)
        addPlanarScreenUvs(child.geometry)
        child.material = material(new THREE.MeshBasicMaterial({
          map: texture,
          color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness),
          toneMapped: false,
        }))
        return
      }

      if (child.name === 'KeyboardKeys') {
        child.material = material(new THREE.MeshPhysicalMaterial({ color: '#0c0d0f', metalness: 0.04, roughness: 0.28, clearcoat: 0.32, clearcoatRoughness: 0.2 }))
      } else if (child.name === 'KeyboardBase') {
        child.material = material(new THREE.MeshPhysicalMaterial({ color: '#15171a', metalness: 0.52, roughness: 0.3, clearcoat: 0.14, clearcoatRoughness: 0.24 }))
      } else if (child.name === 'Trackpad') {
        child.material = material(new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.74, roughness: 0.19, clearcoat: 0.36, clearcoatRoughness: 0.16, sheen: 0.08, sheenColor: new THREE.Color('#ffffff') }))
      } else if (child.name.startsWith('Foot')) {
        child.material = material(new THREE.MeshStandardMaterial({ color: '#111214', metalness: 0.01, roughness: 0.9 }))
      } else if (child.name === 'Apple') {
        child.material = material(new THREE.MeshPhysicalMaterial({ color: '#e1e3e6', metalness: 0.94, roughness: 0.1, clearcoat: 0.62, clearcoatRoughness: 0.08 }))
      } else {
        child.material = material(new THREE.MeshPhysicalMaterial({
          color: bodyColor,
          metalness: 0.96,
          roughness,
          clearcoat: 0.2,
          clearcoatRoughness: 0.18,
          anisotropy: 0.18,
          anisotropyRotation: Math.PI / 2,
        }))
      }
    })

    next.userData.ownedGeometries = ownedGeometries
    next.userData.ownedMaterials = ownedMaterials
    return next
  }, [bodyColor, device.screenBrightness, roughness, scene, texture])

  useEffect(() => () => {
    for (const geometry of model.userData.ownedGeometries as THREE.BufferGeometry[]) geometry.dispose()
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 2.05, 0.7]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotX),
        THREE.MathUtils.degToRad(transform.rotY),
        THREE.MathUtils.degToRad(transform.rotZ),
      ]}
      scale={transform.scale}
      onPointerDown={event => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <primitive object={model} scale={0.0202} rotation={[0, Math.PI, 0]} />

      {device.showReflection && (
        <mesh position={[0, 2.42, 3.02]} rotation={[THREE.MathUtils.degToRad(-10), Math.PI, 0]}>
          <planeGeometry args={[5.77, 3.78]} />
          <meshPhysicalMaterial transparent opacity={0.045} color="#dcecff" roughness={0.04} depthWrite={false} />
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
  )
}

useGLTF.preload('/models/macbook-open.glb', false, false)
