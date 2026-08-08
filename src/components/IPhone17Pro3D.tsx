import { Edges, RoundedBox } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import type { DeviceConfig, ScreenContentType, Transform } from '../types'
import { DEVICE_BODY_COLORS } from '../types'
import { useScreenTexture } from './StudioMonitor3D'

interface Props {
  device: DeviceConfig
  transform: Transform
  screenshot: string | null
  screenshotType: ScreenContentType
  selected: boolean
  onSelect: () => void
}

export default function IPhone17Pro3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const source = useLoader(OBJLoader, '/models/iphone-17-pro.obj')
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 1.865717 / 3.913856, offsetX: device.screenOffsetX, offsetY: device.screenOffsetY, scale: device.screenScale })

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = source.clone(true)
    const ownedMaterials: THREE.Material[] = []
    const bodyColor = DEVICE_BODY_COLORS[device.color]

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      const nextMaterials = materials.map(sourceMaterial => {
        const name = sourceMaterial.name.toLowerCase()
        let material: THREE.Material
        if (name === 'display') {
          material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness), side: THREE.DoubleSide })
        } else if (name.includes('dynamic')) {
          material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        } else if (name.includes('display_borders') || name.includes('warnex') || name.includes('side_dark') || name.includes('mesh_grill')) {
          material = new THREE.MeshStandardMaterial({ color: '#08090c', roughness: 0.72, metalness: 0.05, envMapIntensity: 0.22, side: THREE.DoubleSide })
        } else if (name.includes('cam') || name.includes('lidar') || name.includes('mic')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#08090c', roughness: 0.24, metalness: 0.14, clearcoat: 0.2, envMapIntensity: 0.42, side: THREE.DoubleSide })
        } else if (name.includes('torch')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#fff1cd', emissive: '#5c492c', emissiveIntensity: 0.12, roughness: 0.28, side: THREE.DoubleSide })
        } else {
          material = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.74, roughness: device.materialPreset === 'matte' ? 0.66 : 0.4, clearcoat: 0.08, envMapIntensity: 0.5, side: THREE.DoubleSide })
        }
        ownedMaterials.push(material)
        return material
      })
      child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0]
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
      position={[transform.posX / 95, -transform.posY / 95 - 0.08, 0.45 + transform.posZ / 95]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotX),
        THREE.MathUtils.degToRad(transform.rotY),
        THREE.MathUtils.degToRad(transform.rotZ),
      ]}
      scale={[transform.scale * (transform.scaleX ?? 1), transform.scale * (transform.scaleY ?? 1), transform.scale * (transform.scaleZ ?? 1)]}
      onPointerDown={event => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <group scale={normalizedScale} position={[-center.x * normalizedScale, -center.y * normalizedScale, -center.z * normalizedScale]}>
        <primitive object={model} dispose={null} />
      </group>
      <RoundedBox args={[0.66, 0.19, 0.035]} radius={0.09} smoothness={4} position={[-0.018, 1.987, 0.205]}>
        <meshBasicMaterial color="#050609" />
      </RoundedBox>
      {device.showReflection && (
        <RoundedBox args={[2.02, 4.24, 0.008]} radius={0.17} smoothness={4} position={[0, 0, 0.198]}>
          <meshPhysicalMaterial transparent opacity={0.02} color="#dcecff" roughness={0.12} metalness={0} depthWrite={false} />
        </RoundedBox>
      )}

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
