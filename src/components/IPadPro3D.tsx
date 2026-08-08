import { Edges, RoundedBox, useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
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

export default function IPadPro3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const { scene } = useGLTF('/models/ipad-pro.glb', false, false)
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 1.6477 / 2.2033, rotation: Math.PI, offsetX: device.screenOffsetX, offsetY: device.screenOffsetY, scale: device.screenScale })

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = scene.clone(true)
    const ownedMaterials: THREE.Material[] = []

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      const nextMaterials = materials.map(sourceMaterial => {
        let material: THREE.Material
        if (sourceMaterial.name === 'Material.010') {
          material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness) })
        } else if (sourceMaterial.name === 'Material.009' || sourceMaterial.name === 'Material.003') {
          material = new THREE.MeshPhysicalMaterial({ color: '#050609', roughness: 0.22, clearcoat: 0.18, envMapIntensity: 0.42, side: THREE.DoubleSide })
        } else if (sourceMaterial.name === 'Material' || sourceMaterial.name === 'Material.007' || sourceMaterial.name === 'Material.008') {
          material = new THREE.MeshPhysicalMaterial({
            color: DEVICE_BODY_COLORS[device.color],
            metalness: 0.74,
            roughness: device.materialPreset === 'matte' ? 0.68 : 0.4,
            clearcoat: 0.08,
            envMapIntensity: 0.5,
            side: THREE.DoubleSide,
          })
        } else {
          material = sourceMaterial.clone()
          material.side = THREE.DoubleSide
        }
        ownedMaterials.push(material)
        return material
      })
      child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0]
    })

    next.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(next)
    const modelSize = box.getSize(new THREE.Vector3())
    const modelCenter = box.getCenter(new THREE.Vector3())
    next.userData.ownedMaterials = ownedMaterials

    return {
      model: next,
      center: modelCenter,
      normalizedScale: 5.15 / Math.max(modelSize.x, modelSize.y),
      size: modelSize,
    }
  }, [device.color, device.materialPreset, device.screenBrightness, scene, texture])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.05, 0.35 + transform.posZ / 95]}
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
      <group rotation={[0, Math.PI, 0]}>
        <group scale={normalizedScale} position={[-center.x * normalizedScale, -center.y * normalizedScale, -center.z * normalizedScale]}>
          <primitive object={model} dispose={null} />
        </group>
      </group>
      {device.showReflection && (
        <RoundedBox args={[3.61, 4.82, 0.012]} radius={0.16} smoothness={4} position={[0, 0, 0.105]}>
          <meshPhysicalMaterial transparent opacity={0.02} color="#dcecff" roughness={0.12} metalness={0} depthWrite={false} />
        </RoundedBox>
      )}

      {selected && (
        <mesh>
          <boxGeometry args={[size.x * normalizedScale * 1.04, size.y * normalizedScale * 1.04, Math.max(size.z * normalizedScale * 1.25, 0.28)]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#3b7ef8" />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/models/ipad-pro.glb', false, false)
