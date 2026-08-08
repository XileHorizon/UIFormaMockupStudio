import { useEffect, useMemo, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { DeviceConfig, ScreenContentType, Transform } from '../types'

interface Props {
  device: DeviceConfig
  transform: Transform
  screenshot: string | null
  screenshotType: ScreenContentType
  selected: boolean
  onSelect: () => void
}

const BODY_COLORS = {
  'space-black': '#202124',
  silver: '#c8c9cb',
  white: '#e8e8e6',
  gold: '#d3b997',
  blue: '#6f98b8',
  orange: '#d97948',
} as const

interface ScreenTextureOptions {
  aspect?: number
  flipY?: boolean
  rotation?: number
}

function fitTextureToScreen(texture: THREE.Texture, screenAspect: number, flipY: boolean, rotation: number) {
  const image = texture.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined
  const width = image?.videoWidth || image?.width || 1
  const height = image?.videoHeight || image?.height || 1
  const imageAspect = width / height

  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(1, 1)
  texture.offset.set(0, 0)

  // Cover the display without distorting the uploaded image. Excess content is
  // cropped evenly, matching the behavior users expect from device mockups.
  if (imageAspect > screenAspect) {
    texture.repeat.x = screenAspect / imageAspect
    texture.offset.x = (1 - texture.repeat.x) / 2
  } else if (imageAspect < screenAspect) {
    texture.repeat.y = imageAspect / screenAspect
    texture.offset.y = (1 - texture.repeat.y) / 2
  }

  texture.flipY = flipY
  texture.center.set(0.5, 0.5)
  texture.rotation = rotation
  texture.updateMatrix()
  texture.needsUpdate = true
}

export function useScreenTexture(source: string | null, type: ScreenContentType, options: ScreenTextureOptions = {}) {
  const { aspect = 16 / 9, flipY = true, rotation = 0 } = options
  const placeholder = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1400
    canvas.height = 900
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#10152b')
    gradient.addColorStop(0.48, '#4a2769')
    gradient.addColorStop(1, '#e87358')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(255,255,255,.96)'
    ctx.font = '600 76px Inter, sans-serif'
    ctx.fillText('UIForma', 92, 130)
    ctx.fillStyle = 'rgba(255,255,255,.62)'
    ctx.font = '34px Inter, sans-serif'
    ctx.fillText('Drop a design onto the display', 96, 190)
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.13 - i * 0.025})`
      ctx.roundRect(96 + i * 390, 570 - i * 70, 330, 210, 26)
      ctx.fill()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    fitTextureToScreen(texture, aspect, flipY, rotation)
    return texture
  }, [aspect, flipY, rotation])

  const [texture, setTexture] = useState<THREE.Texture>(placeholder)

  useEffect(() => {
    if (!source) {
      setTexture(placeholder)
      return
    }

    if (type === 'video') {
      const video = document.createElement('video')
      video.src = source
      video.muted = true
      video.loop = true
      video.playsInline = true
      void video.play()
      const next = new THREE.VideoTexture(video)
      next.colorSpace = THREE.SRGBColorSpace
      video.addEventListener('loadedmetadata', () => fitTextureToScreen(next, aspect, flipY, rotation), { once: true })
      setTexture(next)
      return () => {
        video.pause()
        next.dispose()
      }
    }

    let active = true
    new THREE.TextureLoader().load(source, next => {
      if (!active) return next.dispose()
      next.colorSpace = THREE.SRGBColorSpace
      next.anisotropy = 8
      fitTextureToScreen(next, aspect, flipY, rotation)
      setTexture(next)
    })
    return () => { active = false }
  }, [aspect, flipY, placeholder, rotation, source, type])

  return texture
}

export default function StudioMonitor3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 5.59 / 3.22 })
  const body = BODY_COLORS[device.color]
  const roughness = device.materialPreset === 'matte' ? 0.72 : 0.42
  const metalness = device.materialPreset === 'glass' ? 0.25 : 0.74

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.15, 0]}
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
      <RoundedBox args={[6.15, 3.82, 0.28]} radius={0.16} smoothness={6} position={[0, 0.85, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={body} metalness={metalness} roughness={roughness} clearcoat={0.08} clearcoatRoughness={0.42} envMapIntensity={0.52} />
      </RoundedBox>

      <RoundedBox args={[5.82, 3.48, 0.035]} radius={0.08} smoothness={5} position={[0, 0.85, 0.157]}>
        <meshStandardMaterial color="#07080b" roughness={0.28} metalness={0.04} envMapIntensity={0.4} />
      </RoundedBox>

      <mesh position={[0, 0.85, 0.18]}>
        <planeGeometry args={[5.59, 3.22]} />
        <meshBasicMaterial map={texture} toneMapped={false} color={new THREE.Color(device.screenBrightness, device.screenBrightness, device.screenBrightness)} />
      </mesh>

      {device.showReflection && (
        <mesh position={[0, 0.85, 0.186]}>
          <planeGeometry args={[5.59, 3.22]} />
          <meshPhysicalMaterial transparent opacity={0.035} color="#dcecff" roughness={0.08} metalness={0} depthWrite={false} />
        </mesh>
      )}

      <mesh position={[0, 0.84, -0.17]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.055, 48]} />
        <meshStandardMaterial color="#92959a" metalness={0.72} roughness={0.42} envMapIntensity={0.5} />
      </mesh>

      <RoundedBox args={[0.68, 2.25, 0.19]} radius={0.09} smoothness={5} position={[0, -1.38, -0.03]} castShadow>
        <meshPhysicalMaterial color={body} metalness={0.74} roughness={0.42} clearcoat={0.08} envMapIntensity={0.5} />
      </RoundedBox>

      <RoundedBox args={[2.75, 0.13, 1.2]} radius={0.11} smoothness={6} position={[0, -2.47, 0.17]} castShadow receiveShadow>
        <meshPhysicalMaterial color={body} metalness={0.74} roughness={0.44} clearcoat={0.06} envMapIntensity={0.5} />
      </RoundedBox>

      <mesh position={[0, 2.43, 0.205]}>
        <circleGeometry args={[0.024, 24]} />
        <meshBasicMaterial color="#111318" />
      </mesh>

      {selected && (
        <RoundedBox args={[6.3, 3.97, 0.34]} radius={0.19} smoothness={5} position={[0, 0.85, 0]}>
          <meshBasicMaterial color="#3b7ef8" wireframe transparent opacity={0.38} depthTest={false} />
        </RoundedBox>
      )}

    </group>
  )
}
