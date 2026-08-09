import { Edges } from '@react-three/drei'
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

export default function IMac2021ThreeD({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const source = useLoader(OBJLoader, '/models/imac-2021.obj')
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 16 / 9, offsetX: device.screenOffsetX, offsetY: device.screenOffsetY, scale: device.screenScale })

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = source.clone(true)
    const ownedMaterials: THREE.Material[] = []
    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      const nextMaterials = materials.map(sourceMaterial => {
        const name = sourceMaterial.name.toLowerCase()
        let material: THREE.Material
        if (name.includes('imac_front')) {
          material = new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
            side: THREE.DoubleSide,
            color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness),
          })
        } else if (name.includes('bezel') || name.includes('display_frame') || name.includes('webcam')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#050609', roughness: 0.2, clearcoat: 0.2, side: THREE.DoubleSide, envMapIntensity: 0.45 })
        } else if (name.includes('glass')) {
          material = child.name.startsWith('Mesh7')
            ? new THREE.MeshPhysicalMaterial({ color: '#d7d9dc', metalness: 0.08, roughness: 0.34, clearcoat: 0.12, side: THREE.DoubleSide, envMapIntensity: 0.4 })
            : new THREE.MeshPhysicalMaterial({ color: '#22252a', metalness: 0.25, roughness: 0.24, clearcoat: 0.2, side: THREE.DoubleSide, envMapIntensity: 0.45 })
        } else if (name.includes('metal') || name.includes('aluminum') || name.includes('frontcolor') || name.includes('material13')) {
          material = new THREE.MeshPhysicalMaterial({ color: DEVICE_BODY_COLORS[device.color], metalness: 0.76, roughness: device.materialPreset === 'matte' ? 0.68 : 0.38, clearcoat: 0.08, side: THREE.DoubleSide, envMapIntensity: 0.5 })
        } else {
          material = new THREE.MeshStandardMaterial({ color: '#34363a', metalness: 0.34, roughness: 0.56, side: THREE.DoubleSide, envMapIntensity: 0.4 })
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
    return { model: next, center: modelCenter, normalizedScale: 6.15 / Math.max(modelSize.x, modelSize.y), size: modelSize }
  }, [device.color, device.materialPreset, device.screenBrightness, device.showReflection, source, texture])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.12, 0.25 + transform.posZ / 95]}
      rotation={[THREE.MathUtils.degToRad(transform.rotX), THREE.MathUtils.degToRad(transform.rotY), THREE.MathUtils.degToRad(transform.rotZ)]}
      scale={[transform.scale * (transform.scaleX ?? 1), transform.scale * (transform.scaleY ?? 1), transform.scale * (transform.scaleZ ?? 1)]}
      onPointerDown={event => { event.stopPropagation(); onSelect() }}
    >
      <group scale={normalizedScale} position={[-center.x * normalizedScale, -center.y * normalizedScale, -center.z * normalizedScale]}>
        <primitive object={model} dispose={null} />
      </group>
      {selected && (
        <mesh>
          <boxGeometry args={[size.x * normalizedScale * 1.03, size.y * normalizedScale * 1.03, size.z * normalizedScale * 1.08]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#3b7ef8" />
        </mesh>
      )}
    </group>
  )
}

useLoader.preload(OBJLoader, '/models/imac-2021.obj')
