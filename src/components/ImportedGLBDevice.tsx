import { Edges, useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { DeviceConfig, ScreenContentType, Transform } from '../types'
import { useScreenTexture } from './StudioMonitor3D'

interface Props {
  assetPath: string
  transform: Transform
  selected: boolean
  onSelect: () => void
  targetSize?: number
  modelRotation?: [number, number, number]
  appearance?: 'original' | 'switch'
  device: DeviceConfig
  screenshot: string | null
  screenshotType: ScreenContentType
  screenAspect: number
  screenFlipY?: boolean
}

export default function ImportedGLBDevice({
  assetPath,
  transform,
  selected,
  onSelect,
  targetSize = 4.8,
  modelRotation = [0, 0, 0],
  appearance = 'original',
  device,
  screenshot,
  screenshotType,
  screenAspect,
  screenFlipY = false,
}: Props) {
  const { scene } = useGLTF(assetPath, false, false)
  const screenTexture = useScreenTexture(screenshot, screenshotType, {
    aspect: screenAspect,
    flipY: screenFlipY,
    offsetX: device.screenOffsetX,
    offsetY: device.screenOffsetY,
    scale: device.screenScale,
  })
  const { model, center, normalizedScale, size } = useMemo(() => {
    const next = scene.clone(true)
    const ownedMaterials: THREE.Material[] = []
    next.rotation.set(...modelRotation)
    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
      if (appearance === 'switch') {
        const sources = Array.isArray(child.material) ? child.material : [child.material]
        const materials = sources.map(source => {
          const name = source.name.toUpperCase()
          const isScreen = name === 'SCREEN' || child.name.toUpperCase() === 'SCREEN'
          if (isScreen) {
            const material = new THREE.MeshBasicMaterial({
              map: screenTexture,
              toneMapped: false,
              side: THREE.DoubleSide,
              color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness),
            })
            material.name = source.name
            ownedMaterials.push(material)
            return material
          }
          const color = name.includes('BLUE') ? '#00a6d6'
            : name.includes('RED') ? '#ff4554'
              : name.includes('SCREEN') ? '#05070a'
                : name.includes('GLASS') || name.includes('RUBBER') || name.includes('INFRARED') || name.includes('SPEAKER') ? '#15181c'
                  : name.includes('METAL') || name.includes('SCREW') ? '#777d84'
                    : '#2d3035'
          const material = new THREE.MeshPhysicalMaterial({
            color,
            metalness: name.includes('METAL') || name.includes('SCREW') ? 0.72 : 0.04,
            roughness: name.includes('SCREEN') || name.includes('GLASS') ? 0.16 : 0.48,
            clearcoat: name.includes('SHINY') || name.includes('GLASS') ? 0.22 : 0.04,
            envMapIntensity: 0.58,
          })
          material.name = source.name
          ownedMaterials.push(material)
          return material
        })
        child.material = Array.isArray(child.material) ? materials : materials[0]
      } else if (child.name.toUpperCase() === 'SCREEN') {
        const geometry = child.geometry.clone()
        geometry.computeBoundingBox()
        const bounds = geometry.boundingBox!
        const positions = geometry.getAttribute('position')
        const uvs = new Float32Array(positions.count * 2)
        const width = Math.max(0.0001, bounds.max.z - bounds.min.z)
        const height = Math.max(0.0001, bounds.max.y - bounds.min.y)
        for (let index = 0; index < positions.count; index += 1) {
          uvs[index * 2] = (positions.getZ(index) - bounds.min.z) / width
          uvs[index * 2 + 1] = (positions.getY(index) - bounds.min.y) / height
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        geometry.userData.importedScreenOwned = true
        child.geometry = geometry
        const material = new THREE.MeshBasicMaterial({
          map: screenTexture,
          toneMapped: false,
          side: THREE.DoubleSide,
          color: new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness),
        })
        material.name = Array.isArray(child.material) ? child.material[0]?.name ?? 'Screen' : child.material.name
        ownedMaterials.push(material)
        child.material = material
      } else if (child.name.toUpperCase() === 'GLASS') {
        const material = new THREE.MeshPhysicalMaterial({
          color: '#dcecff',
          transparent: true,
          opacity: 0.1,
          roughness: 0.08,
          clearcoat: 0.35,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        material.name = 'Screen glass'
        ownedMaterials.push(material)
        child.material = material
      }
    })
    next.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(next)
    const modelSize = bounds.getSize(new THREE.Vector3())
    return {
      model: next,
      center: bounds.getCenter(new THREE.Vector3()),
      normalizedScale: targetSize / Math.max(modelSize.x, modelSize.y, modelSize.z),
      size: modelSize,
    }
  }, [appearance, device.screenBrightness, modelRotation[0], modelRotation[1], modelRotation[2], scene, screenTexture, targetSize])

  useEffect(() => () => {
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        if (appearance === 'switch' || child.name.toUpperCase() === 'SCREEN' || child.name.toUpperCase() === 'GLASS') material.dispose()
      }
      if (child.geometry.userData.importedScreenOwned) child.geometry.dispose()
    })
  }, [appearance, model])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95, transform.posZ / 95]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotX),
        THREE.MathUtils.degToRad(transform.rotY),
        THREE.MathUtils.degToRad(transform.rotZ),
      ]}
      scale={[
        transform.scale * (transform.scaleX ?? 1),
        transform.scale * (transform.scaleY ?? 1),
        transform.scale * (transform.scaleZ ?? 1),
      ]}
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
