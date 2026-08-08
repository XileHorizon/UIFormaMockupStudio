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

export default function ClosedMacBook3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const { scene } = useGLTF('/models/macbook-open.glb', false, false)
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 5.72 / 3.72 })

  const model = useMemo(() => {
    const next = scene.clone(true)
    const ownedMaterials: THREE.Material[] = []

    const material = (value: THREE.Material) => {
      ownedMaterials.push(value)
      return value
    }

    next.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return

      child.castShadow = true
      child.receiveShadow = true

      // The textured model uses Screen.001 for its display backing and Glass.002
      // for a duplicate glass shell. Keep the backing dark and render screen
      // content on a dedicated plane so uploads do not depend on exporter names
      // or on the screen mesh having usable UV coordinates.
      if (child.name === 'Screen' || child.name === 'Screen.001') {
        child.material = material(new THREE.MeshBasicMaterial({ color: '#050506' }))
      } else if (child.name === 'Glass.002') {
        child.visible = false
      }
    })

    next.userData.ownedMaterials = ownedMaterials
    return next
  }, [scene])

  useEffect(() => () => {
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
      <primitive object={model} scale={0.0202} rotation={[0, 0, 0]} />

      <mesh position={[0, 2.42, -2.22]} rotation={[THREE.MathUtils.degToRad(-10.06), 0, 0]}>
        <planeGeometry args={[5.72, 3.72]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          color={new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness)}
        />
      </mesh>

      {device.showReflection && (
        <mesh position={[0, 2.423, -2.205]} rotation={[THREE.MathUtils.degToRad(-10.06), 0, 0]}>
          <planeGeometry args={[5.72, 3.72]} />
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
