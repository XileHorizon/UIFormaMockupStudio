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
    metalness={0.22}
    roughness={Math.min(0.9, 0.4 + config.blur / 55)}
    clearcoat={0.08}
    clearcoatRoughness={0.5}
    envMapIntensity={0.55}
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
  const width = Math.max(0.36, config.width / 96)
  const height = Math.max(0.36, config.height / 96)
  const shortSide = Math.min(width, height)
  const depth = Math.max(0.045, shortSide * (config.shape === 'plane' ? 0.018 : 0.055))
  const radius = Math.max(0.008, Math.min(config.borderRadius / 120, shortSide * 0.16))
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
      <RoundedBox args={[width * 0.94, height * 0.9, Math.max(0.012, depth * 0.08)]} radius={radius * 0.58} smoothness={4} position={[0, 0, depth * 0.52]}>
        <Material config={config} color={config.secondaryColor} />
      </RoundedBox>
      {selected && <SelectionBox size={[width * 1.025, height * 1.025, depth * 1.35]} />}
    </>}

    {config.shape === 'ring' && <>
      <mesh castShadow={config.showShadow} receiveShadow>
        <torusGeometry args={[Math.min(width, height) * 0.39, Math.min(width, height) * 0.048, 16, 96]} />
        <Material config={config} />
      </mesh>
      <mesh position={[0, 0, shortSide * 0.047]}>
        <torusGeometry args={[shortSide * 0.39, shortSide * 0.012, 10, 96]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[shortSide * 0.92, shortSide * 0.92, shortSide * 0.13]} />}
    </>}

    {config.shape === 'blob' && <>
      <mesh scale={[shortSide * 0.44, shortSide * 0.4, shortSide * 0.15]} rotation={[0.1, -0.16, 0.08]} castShadow={config.showShadow} receiveShadow>
        <icosahedronGeometry args={[1, 2]} />
        <Material config={config} />
      </mesh>
      {selected && <SelectionBox size={[shortSide * 0.94, shortSide * 0.86, shortSide * 0.38]} />}
    </>}

    {config.shape === 'pedestal' && <>
      <mesh castShadow={config.showShadow} receiveShadow>
        <cylinderGeometry args={[width * 0.32, width * 0.34, height * 0.34, 64]} />
        <Material config={config} />
      </mesh>
      <mesh position={[0, height * 0.185, 0]} castShadow={config.showShadow} receiveShadow>
        <cylinderGeometry args={[width * 0.36, width * 0.36, height * 0.03, 64]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      <mesh position={[0, -height * 0.185, 0]} castShadow={config.showShadow} receiveShadow>
        <cylinderGeometry args={[width * 0.34, width * 0.34, height * 0.03, 64]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[width * 0.76, height * 0.44, width * 0.76]} />}
    </>}

    {config.shape === 'plane' && <>
      <RoundedBox args={[width, height, depth]} radius={radius} smoothness={5} castShadow={config.showShadow} receiveShadow>
        <Material config={config} />
      </RoundedBox>
      <mesh position={[0, 0, depth * 0.52]}>
        <planeGeometry args={[width * 0.965, height * 0.945]} />
        <Material config={config} color={config.secondaryColor} />
      </mesh>
      {selected && <SelectionBox size={[width * 1.025, height * 1.025, depth * 1.6]} />}
    </>}
  </group>
}
