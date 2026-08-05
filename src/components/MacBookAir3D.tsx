import { RoundedBox } from '@react-three/drei'
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
  'space-black': '#242529',
  silver: '#c9cacc',
  white: '#e1e2e3',
  gold: '#c9ad89',
} as const

function Keyboard({ isDark }: { isDark: boolean }) {
  const rows = [12, 12, 11, 7]
  return (
    <group position={[0, 0.116, 0.02]}>
      {rows.flatMap((count, row) => Array.from({ length: count }, (_, column) => {
        const width = row === 3 && column === 3 ? 1.38 : 0.35
        const totalWidth = row === 3 ? 4.08 : count * 0.4 - 0.05
        const before = row === 3
          ? [0, .4, .8, 1.2, 2.63, 3.03, 3.43][column]
          : column * 0.4
        return (
          <RoundedBox
            key={`${row}-${column}`}
            args={[width, 0.018, 0.29]}
            radius={0.035}
            smoothness={2}
            position={[-totalWidth / 2 + before + width / 2, 0, -0.43 + row * 0.35]}
          >
            <meshStandardMaterial color={isDark ? '#090a0c' : '#1b1c1e'} metalness={0.15} roughness={0.62} />
          </RoundedBox>
        )
      }))}
    </group>
  )
}

export default function MacBookAir3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const texture = useScreenTexture(screenshot, screenshotType)
  const body = BODY_COLORS[device.color]
  const dark = device.color === 'space-black'
  const roughness = device.materialPreset === 'matte' ? 0.7 : 0.28

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.35, 0]}
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
      {/* Display lid: local X/Y plane, opened behind the keyboard deck. */}
      <group position={[0, 0.72, -1.28]} rotation={[THREE.MathUtils.degToRad(-8), 0, 0]}>
        <RoundedBox args={[5.95, 3.82, 0.16]} radius={0.14} smoothness={6} position={[0, 1.22, 0]} castShadow>
          <meshPhysicalMaterial color={body} metalness={0.88} roughness={roughness} clearcoat={0.22} />
        </RoundedBox>
        <RoundedBox args={[5.73, 3.58, 0.035]} radius={0.1} smoothness={5} position={[0, 1.22, 0.1]}>
          <meshStandardMaterial color="#050506" roughness={0.18} />
        </RoundedBox>
        <mesh position={[0, 1.17, 0.123]}>
          <planeGeometry args={[5.51, 3.24]} />
          <meshBasicMaterial map={texture} toneMapped={false} color={new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness)} />
        </mesh>
        {/* M2 Air display notch. */}
        <RoundedBox args={[0.7, 0.2, 0.025]} radius={0.08} smoothness={4} position={[0, 2.735, 0.145]}>
          <meshBasicMaterial color="#050506" />
        </RoundedBox>
        {device.showReflection && (
          <mesh position={[0, 1.17, 0.13]}>
            <planeGeometry args={[5.51, 3.24]} />
            <meshPhysicalMaterial transparent opacity={0.055} color="#dcecff" roughness={0.06} />
          </mesh>
        )}
      </group>

      {/* Thin tapered unibody deck. */}
      <RoundedBox args={[6.05, 0.16, 4.05]} radius={0.16} smoothness={6} position={[0, 0, 0.55]} castShadow receiveShadow>
        <meshPhysicalMaterial color={body} metalness={0.9} roughness={roughness} clearcoat={0.2} />
      </RoundedBox>
      <Keyboard isDark={dark} />
      <RoundedBox args={[2.25, 0.012, 1.25]} radius={0.08} smoothness={4} position={[0, 0.104, 1.25]}>
        <meshStandardMaterial color={body} metalness={0.72} roughness={0.42} />
      </RoundedBox>
      <mesh position={[0, 0.086, 2.58]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.3, 0.018, 0.04]} />
        <meshStandardMaterial color={dark ? '#111216' : '#aeb0b3'} metalness={0.8} roughness={0.3} />
      </mesh>

      {selected && (
        <RoundedBox args={[6.25, 0.24, 4.22]} radius={0.19} smoothness={5} position={[0, 0, 0.55]}>
          <meshBasicMaterial color="#3b7ef8" wireframe transparent opacity={0.38} depthTest={false} />
        </RoundedBox>
      )}
    </group>
  )
}
