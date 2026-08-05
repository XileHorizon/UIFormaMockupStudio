import { useGLTF } from '@react-three/drei'
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
  silver: '#c9cbce',
  white: '#e1e2e4',
  gold: '#c8aa84',
} as const

type MacBookGLTF = {
  nodes: Record<string, THREE.Mesh>
}

export default function ClosedMacBook3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  // This GLB uses plain glTF buffers. Keep Draco and Meshopt disabled so the
  // loader does not initialize unnecessary WASM decoders under the site CSP.
  const { nodes } = useGLTF('/models/macbook-closed.glb', false, false) as unknown as MacBookGLTF
  const texture = useScreenTexture(screenshot, screenshotType)
  const bodyColor = BODY_COLORS[device.color]
  const roughness = device.materialPreset === 'matte' ? 0.62 : 0.27

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.45, 0]}
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
      {/* The supplied CAD base stays horizontal. Coordinates are millimetres. */}
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.0197} position={[0, 0, 0]}>
        <mesh geometry={nodes.Macbook_Base.geometry} castShadow receiveShadow>
          <meshPhysicalMaterial color={bodyColor} metalness={0.92} roughness={roughness} clearcoat={0.18} clearcoatRoughness={0.24} />
        </mesh>
      </group>

      {/* Pivot the separate lid mesh around its rear edge to a natural 100° opening. */}
      <group position={[0, 0, -2.118]} rotation={[THREE.MathUtils.degToRad(-100), 0, 0]}>
        <group position={[0, 0, 2.118]}>
          <group rotation={[-Math.PI / 2, 0, 0]} scale={0.0197}>
            <mesh geometry={nodes.Macbook_Screen.geometry} castShadow receiveShadow>
              <meshPhysicalMaterial color={bodyColor} metalness={0.9} roughness={roughness + 0.04} clearcoat={0.16} clearcoatRoughness={0.26} />
            </mesh>
          </group>
          <mesh position={[0, -0.226, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5.52, 3.48]} />
            <meshBasicMaterial
              map={texture}
              toneMapped={false}
              color={new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness)}
            />
          </mesh>
          {device.showReflection && (
            <mesh position={[0, -0.229, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[5.52, 3.48]} />
              <meshPhysicalMaterial transparent opacity={0.055} color="#dcecff" roughness={0.06} />
            </mesh>
          )}
        </group>
      </group>

      {selected && (
        <mesh position={[0, 1.85, -2.52]}>
          <boxGeometry args={[6.12, 4.2, 1.25]} />
          <meshBasicMaterial color="#3b7ef8" wireframe transparent opacity={0.42} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/models/macbook-closed.glb', false, false)
