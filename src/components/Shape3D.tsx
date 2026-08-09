import { Edges, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ShapeConfig, Transform } from '../types'

interface Props {
  config: ShapeConfig
  transform: Transform
  selected: boolean
  onSelect: () => void
}

function Material({ config, color = config.color }: { config: ShapeConfig; color?: string }) {
  const transparent = config.opacity < 1
  return <meshPhysicalMaterial
    color={color}
    transparent={transparent}
    opacity={config.opacity}
    depthWrite={config.opacity > 0.35}
    metalness={0.12}
    roughness={Math.min(0.9, 0.24 + config.blur / 60)}
    clearcoat={0.35}
    clearcoatRoughness={0.3}
    envMapIntensity={0.7}
  />
}

function SelectionBox({ size }: { size: [number, number, number] }) {
  return <mesh>
    <boxGeometry args={size} />
    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    <Edges color="#3b7ef8" />
  </mesh>
}

export default function Shape3D({ config, transform, selected, onSelect }: Props) {
  const width = Math.max(0.4, config.width / 75)
  const height = Math.max(0.4, config.height / 75)
  const depth = Math.max(0.08, Math.min(width, height) * (config.shape === 'plane' ? 0.035 : 0.12))
  const radius = Math.max(0.01, Math.min(config.borderRadius / 75, Math.min(width, height) * 0.45))
  const scale: [number, number, number] = [
    transform.scale * (transform.scaleX ?? 1),
    transform.scale * (transform.scaleY ?? 1),
    transform.scale * (transform.scaleZ ?? 1),
  ]

  return <group
    position={[transform.posX / 95, -transform.posY / 95, transform.posZ / 95]}
    rotation={[
      THREE.MathUtils.degToRad(transform.rotX),
      THREE.MathUtils.degToRad(transform.rotY),
      THREE.MathUtils.degToRad(transform.rotZ),
    ]}
    scale={scale}
    onPointerDown={event => { event.stopPropagation(); onSelect() }}
  >
    {config.shape === 'card' && <>
      <RoundedBox args={[width, height, depth]} radius={radius} smoothness={6} castShadow={config.showShadow} receiveShadow>
        <Material config={config} />
      </RoundedBox>
      <RoundedBox args={[width * 0.92, height * 0.9, depth * 0.18]} radius={radius * 0.8} smoothness={5} position={[0, 0, depth * 0.55]}>
        <Material config={config} color={config.secondaryColor} />
      </RoundedBox>
      {selected && <SelectionBox size={[width * 1.04, height * 1.04, depth * 1.5]} />}
    </>}

    {config.shape === 'ring' && <>
      <mesh castShadow={config.showShadow} receiveShadow>
        <torusGeometry args={[Math.max(width, height) * 0.38, Math.max(width, height) * 0.095, 24, 96]} />
        <Material config={config} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[Math.max(width, height) * 0.38, Math.max(width, height) * 0.055, 18, 96, Math.PI]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[Math.max(width, height), Math.max(width, height), Math.max(width, height) * 0.22]} />}
    </>}

    {config.shape === 'blob' && <>
      <mesh scale={[width * 0.52, height * 0.5, Math.min(width, height) * 0.34]} rotation={[0.18, -0.25, 0.12]} castShadow={config.showShadow} receiveShadow>
        <icosahedronGeometry args={[1, 5]} />
        <Material config={config} />
      </mesh>
      <mesh position={[-width * 0.12, height * 0.08, Math.min(width, height) * 0.23]} scale={[width * 0.24, height * 0.21, Math.min(width, height) * 0.08]}>
        <sphereGeometry args={[1, 40, 24]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[width * 1.08, height * 1.08, Math.min(width, height) * 0.8]} />}
    </>}

    {config.shape === 'pedestal' && <>
      <mesh position={[0, -height * 0.08, 0]} castShadow={config.showShadow} receiveShadow>
        <cylinderGeometry args={[width * 0.22, width * 0.29, height * 0.72, 64]} />
        <Material config={config} />
      </mesh>
      <mesh position={[0, height * 0.32, 0]} castShadow={config.showShadow} receiveShadow>
        <cylinderGeometry args={[width * 0.38, width * 0.32, height * 0.12, 64]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      <mesh position={[0, -height * 0.49, 0]} castShadow={config.showShadow} receiveShadow>
        <cylinderGeometry args={[width * 0.5, width * 0.42, height * 0.12, 64]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[width * 1.04, height * 1.04, width * 1.04]} />}
    </>}

    {config.shape === 'plane' && <>
      <RoundedBox args={[width, height, depth]} radius={radius} smoothness={5} castShadow={config.showShadow} receiveShadow>
        <Material config={config} />
      </RoundedBox>
      <mesh position={[0, 0, depth * 0.52]}>
        <planeGeometry args={[width * 0.94, height * 0.94]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[width * 1.04, height * 1.04, depth * 1.8]} />}
    </>}
  </group>
}
