import { Edges, useGLTF, useTexture } from '@react-three/drei'
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

export default function Laptop3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const { scene } = useGLTF('/models/laptop-3d.glb', false, false)
  const screenTexture = useScreenTexture(screenshot, screenshotType, { aspect: 5.34 / 3.33, offsetX: device.screenOffsetX, offsetY: device.screenOffsetY, scale: device.screenScale })
  const keyboardTexture = useTexture('/models/laptop-keyboard.png')
  keyboardTexture.colorSpace = THREE.SRGBColorSpace
  keyboardTexture.flipY = false
  keyboardTexture.anisotropy = 8

  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = scene.clone(true)
    const ownedMaterials: THREE.Material[] = []
    const ownedGeometries: THREE.BufferGeometry[] = []

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      if (materials.some(material => material.name === 'Material.004')) {
        const geometry = child.geometry.clone()
        geometry.computeBoundingBox()
        const bounds = geometry.boundingBox!
        const width = bounds.max.x - bounds.min.x
        const height = bounds.max.y - bounds.min.y
        const positions = geometry.getAttribute('position')
        const uvs = new Float32Array(positions.count * 2)

        for (let index = 0; index < positions.count; index += 1) {
          uvs[index * 2] = (positions.getX(index) - bounds.min.x) / width
          uvs[index * 2 + 1] = (positions.getY(index) - bounds.min.y) / height
        }

        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        child.geometry = geometry
        ownedGeometries.push(geometry)
      }
      const nextMaterials = materials.map(sourceMaterial => {
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
            color: DEVICE_BODY_COLORS[device.color],
            metalness: 0.72,
            roughness: device.materialPreset === 'matte' ? 0.7 : 0.42,
            clearcoat: 0.08,
            envMapIntensity: 0.5,
            side: THREE.DoubleSide,
          })
        } else if (sourceMaterial.name === 'Material.002') {
          material = new THREE.MeshPhysicalMaterial({ color: '#08090c', roughness: 0.26, clearcoat: 0.16, envMapIntensity: 0.42, side: THREE.DoubleSide })
        } else {
          material = sourceMaterial.clone()
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
    return {
      model: next,
      center: modelCenter,
      normalizedScale: 5.7 / Math.max(modelSize.x, modelSize.y, modelSize.z),
      size: modelSize,
    }
  }, [device.color, device.materialPreset, device.screenBrightness, keyboardTexture, scene, screenTexture])

  useEffect(() => () => {
    for (const material of model.userData.ownedMaterials as THREE.Material[]) material.dispose()
    for (const geometry of model.userData.ownedGeometries as THREE.BufferGeometry[]) geometry.dispose()
  }, [model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.25, 0.2 + transform.posZ / 95]}
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
        <primitive object={model} dispose={null} />
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
