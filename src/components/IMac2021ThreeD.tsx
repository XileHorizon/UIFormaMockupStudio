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
  'space-black': '#292b2f', silver: '#c8cace', white: '#e6e5e1', gold: '#cbb18b', blue: '#6d9bbc', orange: '#df8252',
} as const

export default function IMac2021ThreeD({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const source = useLoader(OBJLoader, '/models/imac-2021.obj')
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 16 / 9 })

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = source.clone(true)
    const ownedMaterials: THREE.Material[] = []
    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      child.material = materials.map(sourceMaterial => {
        const name = sourceMaterial.name.toLowerCase()
        let material: THREE.Material
        if (name.includes('imac_front')) {
          material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness) })
        } else if (name.includes('bezel') || name.includes('display_frame') || name.includes('webcam')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#050506', roughness: 0.13, clearcoat: 0.65, side: THREE.DoubleSide })
        } else if (name.includes('glass')) {
          material = new THREE.MeshPhysicalMaterial({ color: '#dcecff', transparent: true, opacity: device.showReflection ? 0.06 : 0, roughness: 0.04, depthWrite: false, side: THREE.DoubleSide })
        } else if (name.includes('metal') || name.includes('aluminum') || name.includes('frontcolor') || name.includes('material13')) {
          material = new THREE.MeshPhysicalMaterial({ color: BODY_COLORS[device.color], metalness: 0.84, roughness: device.materialPreset === 'matte' ? 0.7 : 0.31, clearcoat: 0.22, side: THREE.DoubleSide })
        } else {
          material = new THREE.MeshStandardMaterial({ color: '#34363a', metalness: 0.42, roughness: 0.5, side: THREE.DoubleSide })
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
    return { model: next, center: modelCenter, normalizedScale: 6.15 / Math.max(modelSize.x, modelSize.y), size: modelSize }
  }, [device.color, device.materialPreset, device.screenBrightness, device.showReflection, source, texture])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.12, 0.25]}
      rotation={[THREE.MathUtils.degToRad(transform.rotX), THREE.MathUtils.degToRad(transform.rotY), THREE.MathUtils.degToRad(transform.rotZ)]}
      scale={transform.scale}
      onPointerDown={event => { event.stopPropagation(); onSelect() }}
    >
      <group scale={normalizedScale} position={[-center.x * normalizedScale, -center.y * normalizedScale, -center.z * normalizedScale]}>
        <primitive object={model} />
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
