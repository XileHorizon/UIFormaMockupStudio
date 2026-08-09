import { Suspense, useRef, useCallback, useEffect, useState, type MutableRefObject, type PointerEvent } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { evaluateScene } from '../layout-engine'
import { useEditor } from '../store'
import ClosedMacBook3D from './ClosedMacBook3D'
import IPhone17Pro3D from './IPhone17Pro3D'
import IPadPro3D from './IPadPro3D'
import Laptop3D from './Laptop3D'
import IMac2021ThreeD from './IMac2021ThreeD'
import TextElement from './TextElement'
import ShapeElement from './ShapeElement'
import type { SceneObject } from '../types'

function getCanvasBackground(bg: { type: string; color: string; gradientFrom: string; gradientTo: string; gradientAngle: number }): string {
  switch (bg.type) {
    case 'solid':           return bg.color
    case 'gradient-linear': return `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`
    case 'gradient-radial': return `radial-gradient(ellipse at 50% 40%, ${bg.gradientFrom}, ${bg.gradientTo})`
    case 'blob':
      return `radial-gradient(ellipse 60% 50% at 30% 40%, ${bg.gradientFrom}88, transparent),
              radial-gradient(ellipse 50% 60% at 70% 60%, ${bg.gradientTo}66, transparent), ${bg.color}`
    default: return 'transparent'
  }
}

function kelvinColor(kelvin: number) {
  const temperature = Math.max(1000, Math.min(12000, kelvin)) / 100
  const red = temperature <= 66 ? 255 : 329.698727446 * Math.pow(temperature - 60, -0.1332047592)
  const green = temperature <= 66 ? 99.4708025861 * Math.log(temperature) - 161.1195681661 : 288.1221695283 * Math.pow(temperature - 60, -0.0755148492)
  const blue = temperature >= 66 ? 255 : temperature <= 19 ? 0 : 138.5177312231 * Math.log(temperature - 10) - 305.0447927307
  return new THREE.Color(Math.max(0, Math.min(255, red)) / 255, Math.max(0, Math.min(255, green)) / 255, Math.max(0, Math.min(255, blue)) / 255)
}

interface DragState {
  startX: number; startY: number; startRotX: number; startRotY: number
  objectId: string | null; active: boolean
}

function TransformGizmo({ object, tool, onChange }: { object: SceneObject; tool: 'move' | 'rotate' | 'scale'; onChange: (changes: Partial<SceneObject['transform']>) => void }) {
  const begin = (kind: 'x' | 'y' | 'z' | 'all', event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const start = { ...object.transform }
    const move = (next: globalThis.PointerEvent) => {
      const dx = next.clientX - startX
      const dy = next.clientY - startY
      if (tool === 'move') {
        if (kind === 'x') onChange({ posX: start.posX + dx })
        else if (kind === 'y') onChange({ posY: start.posY + dy })
        else if (kind === 'z') onChange({ posZ: start.posZ - dy })
        else onChange({ posX: start.posX + dx, posY: start.posY + dy })
      } else if (tool === 'rotate') {
        onChange({ rotZ: start.rotZ + dx * 0.5, rotX: start.rotX + dy * 0.35 })
      } else {
        onChange({ scale: Math.max(0.1, start.scale + (dx - dy) * 0.006) })
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const common = { position: 'absolute' as const, pointerEvents: 'auto' as const, userSelect: 'none' as const, touchAction: 'none' as const }
  return <div data-export-exclude="true" style={{ ...common, left: `calc(50% + ${object.transform.posX}px)`, top: `calc(50% + ${object.transform.posY}px)`, zIndex: 20 }}>
    {tool === 'move' ? <>
      <div onPointerDown={e => begin('all', e)} title="Move freely" style={{ ...common, width: 14, height: 14, left: -7, top: -7, borderRadius: 3, background: '#fff', border: '2px solid #3b7ef8', cursor: 'move' }} />
      <div onPointerDown={e => begin('x', e)} title="Move X" style={{ ...common, left: 7, top: -2, width: 54, height: 4, background: '#ff4d5e', cursor: 'ew-resize' }}><span style={{ position: 'absolute', right: -13, top: -7, color: '#ff6877', fontSize: 10 }}>X</span></div>
      <div onPointerDown={e => begin('y', e)} title="Move Y" style={{ ...common, left: -2, top: 7, width: 4, height: 54, background: '#4dd97b', cursor: 'ns-resize' }}><span style={{ position: 'absolute', left: -3, bottom: -15, color: '#67e18f', fontSize: 10 }}>Y</span></div>
      <div onPointerDown={e => begin('z', e)} title="Move Z (depth)" style={{ ...common, left: -47, top: -47, width: 34, height: 4, background: '#4d8dff', transform: 'rotate(45deg)', transformOrigin: 'right center', cursor: 'ns-resize' }}><span style={{ position: 'absolute', left: -13, top: -7, color: '#69a1ff', fontSize: 10, transform: 'rotate(-45deg)' }}>Z</span></div>
    </> : tool === 'rotate' ?
      <div onPointerDown={e => begin('all', e)} title="Drag to rotate" style={{ ...common, width: 86, height: 86, left: -43, top: -43, borderRadius: '50%', border: '2px solid #ffb84d', cursor: 'grab' }} /> :
      <div onPointerDown={e => begin('all', e)} title="Drag to scale" style={{ ...common, width: 22, height: 22, left: -11, top: -11, border: '2px solid #b36cff', background: 'rgba(179,108,255,.18)', cursor: 'nwse-resize' }} />}
  </div>
}

function SceneCamera({ visibleObjectCount, manuallyAdjusted }: { visibleObjectCount: number; manuallyAdjusted: MutableRefObject<boolean> }) {
  const { camera } = useThree()

  useEffect(() => {
    if (manuallyAdjusted.current) return
    // The editor's sidebars leave a narrow viewport. Pull the camera back as a
    // composition grows so the placement grid remains visible in both the
    // editor and exported image instead of being clipped like a one-device shot.
    const distance = visibleObjectCount <= 1 ? 11.5 : visibleObjectCount === 2 ? 15 : 21
    camera.position.set(0, 0.1, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, manuallyAdjusted, visibleObjectCount])

  return null
}

function PathTracingController() {
  const { gl, scene, camera } = useThree()
  const tracerRef = useRef<import('three-gpu-pathtracer').WebGLPathTracer | null>(null)
  const activeRef = useRef(false)
  const targetSamplesRef = useRef(32)
  const readySentRef = useRef(false)

  useEffect(() => {
    let disposed = false
    const configure = async (event: Event) => {
      const detail = (event as CustomEvent<{ enabled: boolean; samples?: number; bounces?: number; filterGlossyFactor?: number }>).detail
      if (!detail?.enabled) {
        activeRef.current = false
        readySentRef.current = false
        tracerRef.current?.reset()
        return
      }
      try {
        if (!tracerRef.current) {
          const { WebGLPathTracer } = await import('three-gpu-pathtracer')
          if (disposed) return
          tracerRef.current = new WebGLPathTracer(gl)
          tracerRef.current.tiles.set(1, 1)
          tracerRef.current.rasterizeScene = false
          tracerRef.current.renderDelay = 0
          tracerRef.current.fadeDuration = 0
          tracerRef.current.minSamples = 1
        }
        const tracer = tracerRef.current
        tracer.bounces = Math.max(1, Math.min(12, detail.bounces ?? 6))
        tracer.filterGlossyFactor = Math.max(0, Math.min(1, detail.filterGlossyFactor ?? 0.12))
        tracer.textureSize.set(2048, 2048)
        targetSamplesRef.current = Math.max(1, Math.min(512, detail.samples ?? 64))
        readySentRef.current = false
        window.dispatchEvent(new CustomEvent('mockframe-pathtrace-progress', { detail: { samples: 0, target: targetSamplesRef.current } }))

        // The raster preview is intentionally tuned with low, artistic light
        // values and an AmbientLight. The path tracer does not support ambient
        // lights and interprets the remaining lights in physical units, so
        // passing the preview rig through unchanged leaves non-emissive device
        // materials almost black. Temporarily translate the rig to useful path
        // tracing values while its light/environment uniforms are captured.
        const originalEnvironmentIntensity = scene.environmentIntensity
        const boostedLights: Array<{ light: THREE.Light; intensity: number }> = []
        scene.traverse(child => {
          if (
            (child instanceof THREE.DirectionalLight ||
              child instanceof THREE.SpotLight ||
              child instanceof THREE.PointLight ||
              child instanceof THREE.RectAreaLight) &&
            child.visible
          ) {
            boostedLights.push({ light: child, intensity: child.intensity })
            child.intensity *= 4
          }
        })

        // Keep export preparation on the original, known-good light graph.
        // Scene topology changes during setScene can prevent the path tracer
        // from ever reaching its first sample.
        scene.environmentIntensity = Math.max(0.7, (originalEnvironmentIntensity ?? 1) * 2.5)
        scene.updateMatrixWorld(true)
        try {
          tracer.setScene(scene, camera)
        } finally {
          scene.environmentIntensity = originalEnvironmentIntensity
          boostedLights.forEach(({ light, intensity }) => { light.intensity = intensity })
        }
        if (disposed) return
        tracer.reset()
        activeRef.current = true
      } catch (error) {
        activeRef.current = false
        window.dispatchEvent(new CustomEvent('mockframe-pathtrace-error', { detail: { message: error instanceof Error ? error.message : 'Path tracer could not process this scene.' } }))
      }
    }
    window.addEventListener('mockframe-pathtrace', configure)
    return () => {
      disposed = true
      window.removeEventListener('mockframe-pathtrace', configure)
      tracerRef.current?.dispose()
      tracerRef.current = null
    }
  }, [camera, gl, scene])

  useFrame(() => {
    const tracer = tracerRef.current
    if (!activeRef.current || !tracer) {
      gl.render(scene, camera)
      return
    }
    if (tracer.samples < targetSamplesRef.current) {
      tracer.renderSample()
      const samples = Math.floor(tracer.samples)
      window.dispatchEvent(new CustomEvent('mockframe-pathtrace-progress', { detail: { samples, target: targetSamplesRef.current } }))
    }
    if (tracer.samples >= targetSamplesRef.current && !readySentRef.current) {
      readySentRef.current = true
      window.dispatchEvent(new CustomEvent('mockframe-pathtrace-ready'))
    }
  }, 1)

  return null
}

export default function Canvas3D({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement | null> }) {
  const { state, selectObject, updateTransform } = useEditor()
  const { objects, selectedId, background, lighting } = state
  const selectedIds = state.selectedIds ?? (selectedId ? [selectedId] : [])
  const renderObjects = evaluateScene(state).map(object => {
    const offset = object.patternTransform
    if (!offset) return object
    // Pattern offsets live in the parent's local coordinate space. Rotate the
    // position vector by the editable master rotation before translating it,
    // just as a real nested Three.js group would behave.
    const localPosition = new THREE.Vector3(offset.posX ?? 0, offset.posY ?? 0, offset.posZ ?? 0)
    localPosition.applyEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(object.transform.rotX),
      THREE.MathUtils.degToRad(object.transform.rotY),
      THREE.MathUtils.degToRad(object.transform.rotZ),
      'XYZ',
    ))
    return {
      ...object,
      transform: {
        ...object.transform,
        posX: object.transform.posX + localPosition.x,
        posY: object.transform.posY + localPosition.y,
        posZ: object.transform.posZ + localPosition.z,
        rotX: object.transform.rotX + (offset.rotX ?? 0),
        rotY: object.transform.rotY + (offset.rotY ?? 0),
        rotZ: object.transform.rotZ + (offset.rotZ ?? 0),
      },
    }
  })

  const dragRef = useRef<DragState>({ startX: 0, startY: 0, startRotX: 0, startRotY: 0, objectId: null, active: false })
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraManuallyAdjusted = useRef(false)
  const [renderQuality, setRenderQuality] = useState({ dpr: 2, shadowMapSize: 2048 })

  useEffect(() => {
    const updateQuality = (event: Event) => {
      const detail = (event as CustomEvent<{ dpr?: number; shadowMapSize?: number }>).detail
      setRenderQuality({
        dpr: Math.max(1, Math.min(4, detail?.dpr ?? 2)),
        shadowMapSize: [1024, 2048, 4096].includes(detail?.shadowMapSize ?? 2048) ? detail.shadowMapSize! : 2048,
      })
    }
    window.addEventListener('mockframe-render-quality', updateQuality)
    return () => window.removeEventListener('mockframe-render-quality', updateQuality)
  }, [])

  const onCanvasPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target === e.currentTarget || target.dataset.canvasBg) selectObject(null)
  }, [selectObject])

  const startObjectDrag = useCallback((e: PointerEvent<HTMLDivElement>, obj: SceneObject) => {
    if (obj.locked) return
    e.stopPropagation()
    selectObject(obj.id)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startRotX: obj.transform.rotX, startRotY: obj.transform.rotY, objectId: obj.id, active: true }
    e.currentTarget.setPointerCapture(e.pointerId)
    containerRef.current?.classList.add('dragging')
  }, [selectObject])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !dragRef.current.objectId) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    updateTransform(dragRef.current.objectId, {
      rotY: dragRef.current.startRotY + dx * 0.4,
      rotX: dragRef.current.startRotX + dy * 0.25,
    })
  }, [updateTransform])

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false
    dragRef.current.objectId = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    containerRef.current?.classList.remove('dragging')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') selectObject(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectObject])

  const bg = getCanvasBackground(background)
  const isTransparent = background.type === 'transparent'
  const isGrid = background.type === 'grid'
  const keyAzimuth = THREE.MathUtils.degToRad(lighting.keyAzimuth ?? -35)
  const keyElevation = THREE.MathUtils.degToRad(lighting.keyElevation ?? 42)
  const keyPosition: [number, number, number] = [
    Math.sin(keyAzimuth) * Math.cos(keyElevation) * 10,
    Math.sin(keyElevation) * 10,
    Math.cos(keyAzimuth) * Math.cos(keyElevation) * 10,
  ]
  const keyColor = kelvinColor(lighting.colorTemperature ?? 5200)

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'default' }}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={canvasRef}
        data-canvas-bg="true"
        style={{ position: 'absolute', inset: 0, background: isTransparent ? 'transparent' : bg }}
        className={isTransparent || isGrid ? 'checkerboard' : ''}
      >
        {isGrid && (
          <div data-canvas-bg="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        )}

        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas
            shadows
            dpr={renderQuality.dpr}
            gl={{
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 0.9,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
            camera={{ position: [0, 0.1, 11.5], fov: 38, near: 0.1, far: 100 }}
            onPointerMissed={() => selectObject(null)}
          >
            <SceneCamera visibleObjectCount={renderObjects.filter(object => object.visible).length} manuallyAdjusted={cameraManuallyAdjusted} />
            <PathTracingController />
            <ambientLight intensity={0.08 * lighting.ambientIntensity} />
            <directionalLight
              position={keyPosition}
              intensity={(lighting.keyIntensity ?? 0.88) * lighting.intensity}
              color={keyColor}
              castShadow
              shadow-mapSize={[renderQuality.shadowMapSize, renderQuality.shadowMapSize]}
              shadow-bias={-0.00015}
              shadow-normalBias={0.025}
            />
            <directionalLight position={[6, 2, 4]} intensity={(lighting.fillIntensity ?? 0.24) * lighting.intensity} color="#c5d8ff" />
            {lighting.rimLight && <spotLight position={[1, 5, -6]} intensity={(lighting.rimIntensity ?? 0.58) * lighting.intensity} color="#d6e4ff" angle={0.55} penumbra={1} />}

            <Suspense fallback={null}>
              <Environment
                files="/environments/studio_small_03_1k.hdr"
                environmentIntensity={lighting.environmentIntensity ?? 0.26}
                environmentRotation={[0, THREE.MathUtils.degToRad(lighting.environmentRotation ?? -26), 0]}
              />
              {renderObjects.map(obj => obj.visible && obj.elementType === 'device' && obj.device?.type === 'macbook-air' ? (
                <ClosedMacBook3D
                  key={obj.id}
                  device={obj.device}
                  transform={obj.transform}
                  screenshot={obj.screenshot}
                  screenshotType={obj.screenshotType}
                  selected={obj.id === selectedId}
                  onSelect={() => selectObject(obj.id)}
                />
              ) : obj.visible && obj.elementType === 'device' && obj.device?.type === 'iphone-17-pro' ? (
                <IPhone17Pro3D
                  key={obj.id}
                  device={obj.device}
                  transform={obj.transform}
                  screenshot={obj.screenshot}
                  screenshotType={obj.screenshotType}
                  selected={obj.id === selectedId}
                  onSelect={() => selectObject(obj.id)}
                />
              ) : obj.visible && obj.elementType === 'device' && obj.device?.type === 'ipad-pro' ? (
                <IPadPro3D
                  key={obj.id}
                  device={obj.device}
                  transform={obj.transform}
                  screenshot={obj.screenshot}
                  screenshotType={obj.screenshotType}
                  selected={obj.id === selectedId}
                  onSelect={() => selectObject(obj.id)}
                />
              ) : obj.visible && obj.elementType === 'device' && obj.device?.type === 'laptop-3d' ? (
                <Laptop3D
                  key={obj.id}
                  device={obj.device}
                  transform={obj.transform}
                  screenshot={obj.screenshot}
                  screenshotType={obj.screenshotType}
                  selected={obj.id === selectedId}
                  onSelect={() => selectObject(obj.id)}
                />
              ) : obj.visible && obj.elementType === 'device' && obj.device?.type === 'imac-2021' ? (
                <IMac2021ThreeD
                  key={obj.id}
                  device={obj.device}
                  transform={obj.transform}
                  screenshot={obj.screenshot}
                  screenshotType={obj.screenshotType}
                  selected={obj.id === selectedId}
                  onSelect={() => selectObject(obj.id)}
                />
              ) : null)}
            </Suspense>

            {renderObjects.some(object => object.visible && object.elementType === 'device' && object.device?.showShadow) && (
              <ContactShadows
                position={[0, -2.6, 0]}
                opacity={lighting.shadowOpacity}
                scale={11}
                blur={1.8 + lighting.shadowSoftness * 1.8}
                far={5}
                resolution={1024}
                color="#11141a"
              />
            )}
            <OrbitControls makeDefault enableZoom enableDamping dampingFactor={0.08} minDistance={7} maxDistance={26} minPolarAngle={Math.PI * 0.28} maxPolarAngle={Math.PI * 0.72} onStart={() => { cameraManuallyAdjusted.current = true }} />
          </Canvas>
        </div>

        {selectedId && state.activeTool !== 'select' && (() => {
          const selected = renderObjects.find(object => object.id === selectedId)
          if (!selected || selected.locked) return null
          const selectedObjects = renderObjects.filter(object => selectedIds.includes(object.id) && !object.locked)
          const gizmoObject = selectedObjects.length > 1 ? {
            ...selected,
            transform: {
              ...selected.transform,
              posX: selectedObjects.reduce((sum, object) => sum + object.transform.posX, 0) / selectedObjects.length,
              posY: selectedObjects.reduce((sum, object) => sum + object.transform.posY, 0) / selectedObjects.length,
              posZ: selectedObjects.reduce((sum, object) => sum + object.transform.posZ, 0) / selectedObjects.length,
            },
          } : selected
          const selectedBase = objects.find(object => object.id === selectedId)
          const offset = selectedBase?.patternTransform
          const rotatedPositionOffset = new THREE.Vector3(offset?.posX ?? 0, offset?.posY ?? 0, offset?.posZ ?? 0)
          if (selectedBase) rotatedPositionOffset.applyEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(selectedBase.transform.rotX),
            THREE.MathUtils.degToRad(selectedBase.transform.rotY),
            THREE.MathUtils.degToRad(selectedBase.transform.rotZ),
            'XYZ',
          ))
          return <TransformGizmo object={gizmoObject} tool={state.activeTool} onChange={changes => {
            const baseChanges = { ...changes }
            if (typeof baseChanges.posX === 'number') baseChanges.posX -= rotatedPositionOffset.x
            if (typeof baseChanges.posY === 'number') baseChanges.posY -= rotatedPositionOffset.y
            if (typeof baseChanges.posZ === 'number') baseChanges.posZ -= rotatedPositionOffset.z
            ;(['rotX', 'rotY', 'rotZ'] as const).forEach(key => { if (typeof baseChanges[key] === 'number') baseChanges[key] -= offset?.[key] ?? 0 })
            updateTransform(selected.id, baseChanges)
          }} />
        })()}

        <div data-canvas-bg="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {renderObjects.map(obj => {
            if (!obj.visible) return null
            if (!obj.transform || typeof obj.transform.rotX !== 'number') return null
            const isSelected = selectedIds.includes(obj.id)
            const et = obj.elementType ?? 'device'
            if (et === 'device') return null

            return (
              <div
                key={obj.id}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: `translate(-50%, -50%) translate(${obj.transform.posX}px, ${obj.transform.posY}px) scale3d(${obj.transform.scale * (obj.transform.scaleX ?? 1)}, ${obj.transform.scale * (obj.transform.scaleY ?? 1)}, ${obj.transform.scale * (obj.transform.scaleZ ?? 1)})`,
                  cursor: obj.locked ? 'not-allowed' : 'grab',
                  pointerEvents: 'auto',
                }}
                  onPointerDown={e => { if (obj.generated) { e.stopPropagation(); selectObject(obj.id, e.shiftKey); return } startObjectDrag(e, obj) }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <div style={{ position: 'absolute', inset: -8, borderRadius: 8, border: '1.5px solid rgba(59,126,248,0.6)', boxShadow: '0 0 0 1px rgba(59,126,248,0.2), 0 0 20px rgba(59,126,248,0.08)', pointerEvents: 'none', zIndex: 10 }} />
                )}
                {/* Element type badge on selected */}
                {isSelected && (
                  <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.7)', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 11, border: '1px solid rgba(59,126,248,0.3)' }}>
                    {obj.generated ? `◇ ${obj.name}` : obj.name}
                  </div>
                )}

                {/* 3D perspective container for device + shape */}
                {et === 'shape' ? (
                  <div style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}>
                    {et === 'shape' && obj.shapeConfig && (
                      <ShapeElement config={obj.shapeConfig} transform={obj.transform} />
                    )}
                  </div>
                ) : null}

                {/* Text element (no perspective needed) */}
                {et === 'text' && obj.textConfig && (
                  <TextElement config={obj.textConfig} transform={obj.transform} />
                )}

                {/* Lock indicator */}
                {obj.locked && (
                  <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                    locked
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Canvas hints */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, pointerEvents: 'none' }}>
        {['Orbit to rotate', 'Scroll to zoom', 'Esc to deselect'].map(hint => (
          <div key={hint} style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
            {hint}
          </div>
        ))}
      </div>

      {/* Transform readout */}
      {selectedId && (() => {
        const sel = objects.find(o => o.id === selectedId)
        if (!sel?.transform) return null
        const t = sel.transform
        return (
          <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2, pointerEvents: 'none' }}>
            {[{ l: 'X', v: t.rotX.toFixed(1) }, { l: 'Y', v: t.rotY.toFixed(1) }, { l: 'Z', v: t.rotZ.toFixed(1) }, { l: 'S', v: `${(t.scale * 100).toFixed(0)}%` }].map(r => (
              <div key={r.l} style={{ display: 'flex', gap: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.22)' }}>
                <span style={{ color: 'rgba(255,255,255,0.14)', width: 8 }}>{r.l}</span>
                <span>{r.v}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {objects.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.1)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><rect x="5" y="2" width="14" height="20" rx="3" /><rect x="9" y="5" width="6" height="11" rx="1" /></svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>Empty scene</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Add a device, text, or shape from the sidebar</div>
          </div>
        </div>
      )}
    </div>
  )
}
