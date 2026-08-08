import { Edges, useGLTF, useTexture } from '@react-three/drei'
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
  'space-black': '#24262a',
  silver: '#c8cace',
  white: '#e5e4e0',
  gold: '#cbb28d',
  blue: '#6f98b8',
  orange: '#d97948',
} as const

export default function Laptop3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const { scene } = useGLTF('/models/laptop-3d.glb', false, false)
  const screenTexture = useScreenTexture(screenshot, screenshotType)
  const keyboardTexture = useTexture('/models/laptop-keyboard.png')
  keyboardTexture.colorSpace = THREE.SRGBColorSpace
  keyboardTexture.flipY = false
  keyboardTexture.anisotropy = 8

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = scene.clone(true)
    const ownedMaterials: THREE.Material[] = []

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      child.material = materials.map(sourceMaterial => {
        let material: THREE.Material
        if (sourceMaterial.name === 'Material.004') {
          material = new THREE.MeshBasicMaterial({
            map: screenTexture,
            toneMapped: false,
            side: THREE.DoubleSide,
            color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness),
          })
        } else if (sourceMaterial.name === 'Material') {
          material = new THREE.MeshStandardMaterial({ map: keyboardTexture, roughness: 0.58, side: THREE.DoubleSide })
        } else if (sourceMaterial.name === 'Material.001') {
          material = new THREE.MeshPhysicalMaterial({
            color: BODY_COLORS[device.color],
            metalness: 0.86,
            roughness: device.materialPreset === 'matte' ? 0.7 : 0.32,
            clearcoat: 0.22,
            side: THREE.DoubleSide,
          })
        } else if (sourceMaterial.name === 'Material.002') {
          material = new THREE.MeshPhysicalMaterial({ color: '#08090a', roughness: 0.18, clearcoat: 0.45, side: THREE.DoubleSide })
        } else {
          material = sourceMaterial.clone()
        }
        ownedMaterials.push(material)
        return material
      })
    })

    next.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(next)
    const modelSize = box.getSize(new THREE.Vector3())
    const modelCenter = box.getCenter(new THREE.Vector3())
    next.userData.ownedMaterials = ownedMaterials
    return {
      model: next,
      center: modelCenter,
      normalizedScale: 5.7 / Math.max(modelSize.x, modelSize.y, modelSize.z),
      size: modelSize,
    }
  }, [device.color, device.materialPreset, device.screenBrightness, keyboardTexture, scene, screenTexture])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.25, 0.2]}
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
          <boxGeometry args={[size.x * normalizedScale * 1.04, size.y * normalizedScale * 1.04, size.z * normalizedScale * 1.04]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#3b7ef8" />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/models/laptop-3d.glb', false, false)
useTexture.preload('/models/laptop-keyboard.png')
