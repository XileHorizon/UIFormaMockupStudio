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
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 0.817 / 2.39 })

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = source.clone(true)
    const ownedMaterials: THREE.Material[] = []
    const bodyColor = BODY_COLORS[device.color]

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      child.material = materials.map(sourceMaterial => {
        const name = sourceMaterial.name.toLowerCase()
        let material: THREE.Material
        if (name === 'display') {
          material = new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
            color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness),
          })
        } else if (name.includes('display_borders') || name.includes('dynamic') || name.includes('cam') || name.includes('lidar') || name.includes('mic') || name.includes('warnex')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#08090a', roughness: 0.16, metalness: 0.18, clearcoat: 0.65 })
        } else if (name.includes('torch')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#fff1cd', emissive: '#5c492c', emissiveIntensity: 0.15, roughness: 0.22 })
        } else {
          material = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.86, roughness: device.materialPreset === 'matte' ? 0.66 : 0.3, clearcoat: 0.35 })
        }
        ownedMaterials.push(material)
        return material
      })
    })

    next.userData.ownedMaterials = ownedMaterials
    next.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(next)
    const modelSize = box.getSize(new THREE.Vector3())
    const modelCenter = box.getCenter(new THREE.Vector3())
    next.userData.ownedMaterials = ownedMaterials
    return { model: next, center: modelCenter, normalizedScale: 4.4 / modelSize.y, size: modelSize }
  }, [device.color, device.materialPreset, device.screenBrightness, source, texture])

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
      scale={transform.scale}
      onPointerDown={event => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <group scale={normalizedScale} position={[-center.x * normalizedScale, -center.y * normalizedScale, -center.z * normalizedScale]}>
        <primitive object={model} />
      </group>

      {selected && (
        <mesh>
          <boxGeometry args={[size.x * normalizedScale * 1.04, size.y * normalizedScale * 1.04, Math.max(size.z * normalizedScale * 1.2, 0.28)]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#3b7ef8" />
        </mesh>
      )}
    </group>
  )
}

useLoader.preload(OBJLoader, '/models/iphone-17-pro.obj')
