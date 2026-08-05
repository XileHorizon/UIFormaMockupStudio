import { Suspense, useRef, useCallback, useEffect, type PointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useEditor } from '../store'
import DeviceMockup from './DeviceMockup'
import StudioMonitor3D from './StudioMonitor3D'
import ClosedMacBook3D from './ClosedMacBook3D'
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

interface DragState {
  startX: number; startY: number; startRotX: number; startRotY: number
  objectId: string | null; active: boolean
}

export default function Canvas3D({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement | null> }) {
  const { state, selectObject, updateTransform } = useEditor()
  const { objects, selectedId, background, lighting } = state

  const dragRef = useRef<DragState>({ startX: 0, startY: 0, startRotX: 0, startRotY: 0, objectId: null, active: false })
  const containerRef = useRef<HTMLDivElement>(null)

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

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (!selectedId) return
    const obj = objects.find(o => o.id === selectedId)
    if (!obj || obj.locked) return
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    updateTransform(selectedId, { scale: Math.max(0.1, Math.min(5, obj.transform.scale + delta)) })
  }, [selectedId, objects, updateTransform])

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

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'default' }}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
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
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
            camera={{ position: [0, 0.1, 11.5], fov: 38, near: 0.1, far: 100 }}
            onPointerMissed={() => selectObject(null)}
          >
            <ambientLight intensity={0.45 * lighting.ambientIntensity + 0.18} />
            <directionalLight position={[-5, 8, 7]} intensity={2.2 * lighting.intensity} castShadow shadow-mapSize={[2048, 2048]} />
            <directionalLight position={[6, 2, 4]} intensity={0.85 * lighting.intensity} color="#b8d2ff" />
            {lighting.rimLight && <spotLight position={[1, 5, -6]} intensity={3 * lighting.intensity} color="#c9d9ff" angle={0.55} penumbra={1} />}

            <Suspense fallback={null}>
              {objects.map(obj => obj.visible && obj.elementType === 'device' && (obj.device?.type === 'monitor' || obj.device?.type === 'studio-display') ? (
                <StudioMonitor3D
                  key={obj.id}
                  device={obj.device}
                  transform={obj.transform}
                  screenshot={obj.screenshot}
                  screenshotType={obj.screenshotType}
                  lighting={lighting}
                  selected={obj.id === selectedId}
                  onSelect={() => selectObject(obj.id)}
                />
              ) : obj.visible && obj.elementType === 'device' && obj.device?.type === 'macbook-air' ? (
                <ClosedMacBook3D
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

            <ContactShadows position={[0, -2.6, 0]} opacity={lighting.shadowOpacity} scale={11} blur={2.8} far={5} resolution={1024} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={7} maxDistance={18} minPolarAngle={Math.PI * 0.28} maxPolarAngle={Math.PI * 0.72} />
          </Canvas>
        </div>

        <div data-canvas-bg="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {objects.map(obj => {
            if (!obj.visible) return null
            if (!obj.transform || typeof obj.transform.rotX !== 'number') return null
            const isSelected = obj.id === selectedId
            const et = obj.elementType ?? 'device'
            if (et === 'device' && ['monitor', 'studio-display', 'macbook-air'].includes(obj.device?.type)) return null

            return (
              <div
                key={obj.id}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: `translate(-50%, -50%) translate(${obj.transform.posX}px, ${obj.transform.posY}px) scale(${obj.transform.scale})`,
                  cursor: obj.locked ? 'not-allowed' : 'grab',
                  pointerEvents: 'auto',
                }}
                onPointerDown={e => startObjectDrag(e, obj)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <div style={{ position: 'absolute', inset: -8, borderRadius: 8, border: '1.5px solid rgba(59,126,248,0.6)', boxShadow: '0 0 0 1px rgba(59,126,248,0.2), 0 0 20px rgba(59,126,248,0.08)', pointerEvents: 'none', zIndex: 10 }} />
                )}
                {/* Element type badge on selected */}
                {isSelected && (
                  <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.7)', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 11, border: '1px solid rgba(59,126,248,0.3)' }}>
                    {obj.name}
                  </div>
                )}

                {/* 3D perspective container for device + shape */}
                {(et === 'device' || et === 'shape') ? (
                  <div style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}>
                    {et === 'device' && obj.device?.type && (
                      <DeviceMockup device={obj.device} transform={obj.transform} screenshot={obj.screenshot} screenshotType={obj.screenshotType} lighting={lighting} />
                    )}
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
