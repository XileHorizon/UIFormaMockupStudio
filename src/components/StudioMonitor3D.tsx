import { useEffect, useMemo, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { DeviceConfig, ScreenContentType, Transform } from '../types'
import { DEVICE_BODY_COLORS } from '../types'
import { screenUvPlacement, type ScreenFitMode } from '../deviceGeometry'

interface Props {
  device: DeviceConfig
  transform: Transform
  screenshot: string | null
  screenshotType: ScreenContentType
  selected: boolean
  onSelect: () => void
}

interface ScreenTextureOptions {
  aspect?: number
  flipY?: boolean
  rotation?: number
  offsetX?: number
  offsetY?: number
  scale?: number
  fit?: ScreenFitMode
}

function fitTextureToScreen(texture: THREE.Texture, screenAspect: number, flipY: boolean, rotation: number, offsetX: number, offsetY: number, scale: number, fit: ScreenFitMode) {
  const image = texture.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined
  const width = image?.videoWidth || image?.width || 1
  const height = image?.videoHeight || image?.height || 1
  const imageAspect = width / height

  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  const placement = screenUvPlacement({ imageAspect, screenAspect, mode: fit, scale, offsetX, offsetY, rotation })
  texture.repeat.set(placement.repeatX, placement.repeatY)
  texture.offset.set(placement.offsetX, placement.offsetY)

  texture.flipY = flipY
  texture.center.set(0.5, 0.5)
  texture.rotation = placement.rotation
  texture.updateMatrix()
  texture.needsUpdate = true
}

export function createScreenMaterial(texture: THREE.Texture, brightness: number, background = '#000000', side = THREE.DoubleSide, alphaMap?: THREE.Texture) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
    side,
    color: new THREE.Color(brightness, brightness, brightness),
  })
  if (alphaMap) {
    material.alphaMap = alphaMap
    material.alphaTest = 0.5
    material.transparent = true
  }
  material.onBeforeCompile = shader => {
    shader.uniforms.screenBackground = { value: new THREE.Color(background) }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\nuniform vec3 screenBackground;')
      .replace('#include <map_fragment>', `
#ifdef USE_MAP
  if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) {
    diffuseColor *= vec4(screenBackground, 1.0);
  } else {
    vec4 sampledDiffuseColor = texture2D(map, vMapUv);
    #ifdef DECODE_VIDEO_TEXTURE
      sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);
    #endif
    diffuseColor *= sampledDiffuseColor;
  }
#endif`)
  }
  material.customProgramCacheKey = () => 'uiforma-screen-letterbox-v1'
  return material
}

export function useScreenTexture(source: string | null, type: ScreenContentType, options: ScreenTextureOptions = {}) {
  const { aspect = 16 / 9, flipY = true, rotation = 0, offsetX = 0, offsetY = 0, scale = 1, fit = 'fill' } = options
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
    fitTextureToScreen(texture, aspect, flipY, rotation, offsetX, offsetY, scale, fit)
    return texture
  }, [aspect, fit, flipY, offsetX, offsetY, rotation, scale])

  const [texture, setTexture] = useState<THREE.Texture>(placeholder)

  useEffect(() => () => placeholder.dispose(), [placeholder])

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
      video.addEventListener('loadedmetadata', () => fitTextureToScreen(next, aspect, flipY, rotation, offsetX, offsetY, scale, fit), { once: true })
      setTexture(next)
      return () => {
        video.pause()
        next.dispose()
      }
    }

    let active = true
    let loadedTexture: THREE.Texture | null = null
    new THREE.TextureLoader().load(source, next => {
      if (!active) return next.dispose()
      next.colorSpace = THREE.SRGBColorSpace
      next.anisotropy = 8
      fitTextureToScreen(next, aspect, flipY, rotation, offsetX, offsetY, scale, fit)
      loadedTexture = next
      setTexture(next)
    })
    return () => {
      active = false
      loadedTexture?.dispose()
    }
  }, [aspect, fit, flipY, offsetX, offsetY, placeholder, rotation, scale, source, type])

  return texture
}

export default function StudioMonitor3D({ device, transform, screenshot, screenshotType, selected, onSelect }: Props) {
  const texture = useScreenTexture(screenshot, screenshotType, { aspect: 5.59 / 3.22, offsetX: device.screenOffsetX, offsetY: device.screenOffsetY, scale: device.screenScale, fit: device.screenFit, rotation: device.screenRotation })
  const screenMaterial = useMemo(() => createScreenMaterial(texture, device.screenBrightness, device.screenBackground), [device.screenBackground, device.screenBrightness, texture])
  const body = DEVICE_BODY_COLORS[device.color]
  const roughness = device.materialPreset === 'matte' ? 0.72 : 0.42
  const metalness = device.materialPreset === 'glass' ? 0.25 : 0.74

  useEffect(() => () => screenMaterial.dispose(), [screenMaterial])

  return (
    <group
      position={[transform.posX / 95, -transform.posY / 95 - 0.15, transform.posZ / 95]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotX),
        THREE.MathUtils.degToRad(transform.rotY),
        THREE.MathUtils.degToRad(transform.rotZ),
      ]}
      scale={[transform.scale * (transform.scaleX ?? 1), transform.scale * (transform.scaleY ?? 1), transform.scale * (transform.scaleZ ?? 1)]}
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
        <primitive object={screenMaterial} attach="material" />
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
          <meshBasicMaterial color="#7f8cff" wireframe transparent opacity={0.38} depthTest={false} />
        </RoundedBox>
      )}

    </group>
  )
}
