import { Edges } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import type { DeviceConfig, ScreenContentType, Transform } from '../types'
import { DEVICE_BODY_COLORS } from '../types'
import { createScreenMaterial, useScreenTexture } from './StudioMonitor3D'

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
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 20.175 / 11.412, offsetX: device.screenOffsetX, offsetY: device.screenOffsetY, scale: device.screenScale, fit: device.screenFit, rotation: device.screenRotation })

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = source.clone(true)
    const ownedMaterials: THREE.Material[] = []
    const ownedGeometries: THREE.BufferGeometry[] = []
    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      if (materials.some(material => material.name.toLowerCase().includes('imac_front'))) {
        const geometry = child.geometry.clone()
        geometry.computeBoundingBox()
        const bounds = geometry.boundingBox!
        const positions = geometry.getAttribute('position')
        const uvs = new Float32Array(positions.count * 2)
        const width = bounds.max.x - bounds.min.x
        const height = bounds.max.y - bounds.min.y
        for (let index = 0; index < positions.count; index += 1) {
          uvs[index * 2] = (positions.getX(index) - bounds.min.x) / width
          uvs[index * 2 + 1] = (positions.getY(index) - bounds.min.y) / height
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        child.geometry = geometry
        ownedGeometries.push(geometry)
      }
      const nextMaterials = materials.map(sourceMaterial => {
        const name = sourceMaterial.name.toLowerCase()
        let material: THREE.Material
        if (name.includes('imac_front')) {
          material = createScreenMaterial(texture, device.screenBrightness, device.screenBackground)
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
    next.userData.ownedGeometries = ownedGeometries
    return { model: next, center: modelCenter, normalizedScale: 6.15 / Math.max(modelSize.x, modelSize.y), size: modelSize }
  }, [device.color, device.materialPreset, device.screenBackground, device.screenBrightness, device.showReflection, source, texture])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
    for (const geometry of model.userData.ownedGeometries as THREE.BufferGeometry[]) geometry.dispose()
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
          <Edges color="#7f8cff" />
        </mesh>
      )}
    </group>
  )
}

useLoader.preload(OBJLoader, '/models/imac-2021.obj')
