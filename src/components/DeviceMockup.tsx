import { useMemo } from 'react'
import type { DeviceConfig, Transform, LightingConfig, ScreenContentType } from '../types'
import { LIGHTING_CONFIGS, MATERIAL_PRESETS } from '../types'

interface Props {
  device: DeviceConfig
  transform: Transform
  screenshot: string | null
  screenshotType: ScreenContentType
  lighting: LightingConfig
}

const DEVICE_COLORS: Record<string, { body: string; frame: string; button: string }> = {
  midnight:      { body: '#17191d', frame: '#25282d', button: '#111318' },
  'space-black': { body: '#1c1c1e', frame: '#2a2a2d', button: '#232325' },
  graphite:      { body: '#55565a', frame: '#67686c', button: '#45464a' },
  silver:        { body: '#e8e8e8', frame: '#d0d0d2', button: '#c8c8ca' },
  starlight:     { body: '#d7cfc1', frame: '#e2ddd3', button: '#c0b7a9' },
  gold:          { body: '#f5e6c8', frame: '#d4b896', button: '#c8ae88' },
  red:           { body: '#b7353f', frame: '#cc4b55', button: '#8e2730' },
  orange:        { body: '#d66f35', frame: '#e48149', button: '#ae5425' },
  yellow:        { body: '#d9b83e', frame: '#e4c957', button: '#ae902b' },
  green:         { body: '#4f8b67', frame: '#65a07b', button: '#3a6b4c' },
  blue:          { body: '#527fa8', frame: '#6995ba', button: '#3d6487' },
  purple:        { body: '#745b9a', frame: '#8c72b2', button: '#594478' },
  pink:          { body: '#c77b91', frame: '#d591a4', button: '#a85e75' },
}

function ScreenContent({ screenshot, screenshotType, brightness, borderRadius, offsetX, offsetY, scale }: {
  screenshot: string | null
  screenshotType: ScreenContentType
  brightness: number
  borderRadius: number
  offsetX: number
  offsetY: number
  scale: number
}) {
  if (!screenshot) {
    return (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #0a0a18 0%, #0d1020 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ opacity: 0.18 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>Drop content</span>
      </div>
    )
  }
  if (screenshotType === 'video') {
    return (
      <video
        src={screenshot}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: `${50 + offsetX / 2}% ${50 - offsetY / 2}%`, transform: `scale(${scale})`, display: 'block', filter: `brightness(${brightness})`, borderRadius, background: '#000' }}
      />
    )
  }
  return (
    <img
      src={screenshot}
      alt="Screen"
      style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: `${50 + offsetX / 2}% ${50 - offsetY / 2}%`, transform: `scale(${scale})`, display: 'block', filter: `brightness(${brightness})`, background: '#000' }}
    />
  )
}

function Screen({ screenshot, screenshotType, brightness, reflection, borderRadius, materialOverlay, offsetX = 0, offsetY = 0, scale = 1 }: {
  screenshot: string | null
  screenshotType: ScreenContentType
  brightness: number
  reflection: boolean
  borderRadius: number
  materialOverlay: string
  offsetX?: number
  offsetY?: number
  scale?: number
}) {
  return (
    <>
      <ScreenContent screenshot={screenshot} screenshotType={screenshotType} brightness={brightness} borderRadius={borderRadius} offsetX={offsetX} offsetY={offsetY} scale={scale} />
      {reflection && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 40%)', borderRadius, pointerEvents: 'none' }} />
      )}
      {materialOverlay !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: materialOverlay, borderRadius, pointerEvents: 'none' }} />
      )}
    </>
  )
}

// ── Phone ──────────────────────────────────────────────────────────────────────

function PhoneMockup({ device, screenshot, screenshotType, lighting }: Omit<Props, 'transform'>) {
  const c = DEVICE_COLORS[device.color] ?? DEVICE_COLORS['space-black']
  const cfg = LIGHTING_CONFIGS[lighting.preset]
  const mat = MATERIAL_PRESETS[device.materialPreset ?? 'default']
  const isLight = device.color !== 'space-black'
  const border = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'
  const hi = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)'
  const sp = isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.04)'
  const neonGlow = device.materialPreset === 'neon' ? '0 0 30px rgba(100,120,255,0.8), 0 0 60px rgba(100,120,255,0.4)' : 'none'

  return (
    <div style={{ position: 'relative', width: 220, height: 460, filter: `brightness(${cfg.brightness}) contrast(${cfg.contrast}) ${mat.deviceFilter}`, boxShadow: neonGlow }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(155deg, ${c.frame} 0%, ${c.body} 40%, ${c.body} 70%, ${c.button} 100%)`, borderRadius: 46, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${hi} 0%, transparent 30%, transparent 70%, ${sp} 100%)`, pointerEvents: 'none' }} />
        {mat.bodyOverlay !== 'transparent' && <div style={{ position: 'absolute', inset: 0, background: mat.bodyOverlay, pointerEvents: 'none' }} />}
      </div>
      <div style={{ position: 'absolute', top: 14, left: 12, right: 12, bottom: 14, borderRadius: 36, background: '#000', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5)' }}>
        <Screen screenshot={screenshot} screenshotType={screenshotType} brightness={device.screenBrightness} reflection={device.showReflection} borderRadius={36} materialOverlay={mat.screenOverlay} offsetX={device.screenOffsetX} offsetY={device.screenOffsetY} scale={device.screenScale} />
      </div>
      <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', width: 80, height: 28, background: '#000', borderRadius: 20, zIndex: 10 }} />
      <div style={{ position: 'absolute', left: -3, top: 128, width: 3, height: 36, background: c.button, borderRadius: '2px 0 0 2px', border: `1px solid ${border}`, borderRight: 'none' }} />
      <div style={{ position: 'absolute', left: -3, top: 176, width: 3, height: 36, background: c.button, borderRadius: '2px 0 0 2px', border: `1px solid ${border}`, borderRight: 'none' }} />
      <div style={{ position: 'absolute', right: -3, top: 154, width: 3, height: 48, background: c.button, borderRadius: '0 2px 2px 0', border: `1px solid ${border}`, borderLeft: 'none' }} />
      <div style={{ position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', width: 100, height: 4, background: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', borderRadius: 2, zIndex: 10 }} />
    </div>
  )
}

// ── Laptop ─────────────────────────────────────────────────────────────────────

function LaptopMockup({ device, screenshot, screenshotType, lighting }: Omit<Props, 'transform'>) {
  const c = DEVICE_COLORS[device.color] ?? DEVICE_COLORS['space-black']
  const cfg = LIGHTING_CONFIGS[lighting.preset]
  const mat = MATERIAL_PRESETS[device.materialPreset ?? 'default']
  const isLight = device.color !== 'space-black'
  const border = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.07)'
  const hi = isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)'

  return (
    <div style={{ position: 'relative', filter: `brightness(${cfg.brightness}) contrast(${cfg.contrast}) ${mat.deviceFilter}` }}>
      <div style={{ width: 400, height: 260, background: `linear-gradient(160deg, ${c.frame} 0%, ${c.body} 50%, ${c.button} 100%)`, borderRadius: '14px 14px 4px 4px', border: `1px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${hi} 0%, transparent 35%)`, pointerEvents: 'none' }} />
        {mat.bodyOverlay !== 'transparent' && <div style={{ position: 'absolute', inset: 0, background: mat.bodyOverlay, pointerEvents: 'none' }} />}
        <div style={{ position: 'absolute', top: 12, left: 20, right: 20, bottom: 12, background: '#000', borderRadius: '8px 8px 4px 4px', overflow: 'hidden' }}>
          <Screen screenshot={screenshot} screenshotType={screenshotType} brightness={device.screenBrightness} reflection={device.showReflection} borderRadius={8} materialOverlay={mat.screenOverlay} offsetX={device.screenOffsetX} offsetY={device.screenOffsetY} scale={device.screenScale} />
        </div>
        <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, background: '#333', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>
      <div style={{ width: 400, height: 3, background: isLight ? '#bbb' : '#111', borderTop: `1px solid ${border}` }} />
      <div style={{ width: 400, height: 120, background: `linear-gradient(170deg, ${c.body} 0%, ${c.button} 100%)`, borderRadius: '0 0 10px 10px', border: `1px solid ${border}`, borderTop: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 12, left: 28, right: 28, height: 60 }}>
          {[0, 1, 2, 3].map(row => (
            <div key={row} style={{ display: 'flex', gap: 3, marginBottom: 3, justifyContent: 'center' }}>
              {Array.from({ length: row === 0 ? 14 : row === 3 ? 6 : 13 }).map((_, i) => (
                <div key={i} style={{ height: 11, flex: row === 3 && i === 2 ? 4 : 1, background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)', borderRadius: 2, minWidth: row === 3 && i === 2 ? 80 : 14 }} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 100, height: 30, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)', borderRadius: 6, border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.05)'}` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${hi} 0%, transparent 30%)`, pointerEvents: 'none' }} />
        {mat.bodyOverlay !== 'transparent' && <div style={{ position: 'absolute', inset: 0, background: mat.bodyOverlay, pointerEvents: 'none' }} />}
      </div>
    </div>
  )
}

// ── Tablet ─────────────────────────────────────────────────────────────────────

function TabletMockup({ device, screenshot, screenshotType, lighting }: Omit<Props, 'transform'>) {
  const c = DEVICE_COLORS[device.color] ?? DEVICE_COLORS['space-black']
  const cfg = LIGHTING_CONFIGS[lighting.preset]
  const mat = MATERIAL_PRESETS[device.materialPreset ?? 'default']
  const isLight = device.color !== 'space-black'
  const border = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'
  const hi = isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)'
  const isLand = device.orientation === 'landscape'
  const w = isLand ? 420 : 300
  const h = isLand ? 300 : 420

  return (
    <div style={{ position: 'relative', width: w, height: h, filter: `brightness(${cfg.brightness}) contrast(${cfg.contrast}) ${mat.deviceFilter}` }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(155deg, ${c.frame} 0%, ${c.body} 50%, ${c.button} 100%)`, borderRadius: 24, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${hi} 0%, transparent 30%)`, pointerEvents: 'none' }} />
        {mat.bodyOverlay !== 'transparent' && <div style={{ position: 'absolute', inset: 0, background: mat.bodyOverlay, pointerEvents: 'none' }} />}
      </div>
      <div style={{ position: 'absolute', top: 16, left: 22, right: 22, bottom: 16, borderRadius: 14, background: '#000', overflow: 'hidden' }}>
        <Screen screenshot={screenshot} screenshotType={screenshotType} brightness={device.screenBrightness} reflection={device.showReflection} borderRadius={14} materialOverlay={mat.screenOverlay} offsetX={device.screenOffsetX} offsetY={device.screenOffsetY} scale={device.screenScale} />
      </div>
      <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', border: `1px solid ${border}`, zIndex: 10 }} />
    </div>
  )
}

// ── Browser ────────────────────────────────────────────────────────────────────

function BrowserMockup({ device, screenshot, screenshotType, lighting }: Omit<Props, 'transform'>) {
  const cfg = LIGHTING_CONFIGS[lighting.preset]
  const mat = MATERIAL_PRESETS[device.materialPreset ?? 'default']
  const isLight = device.color === 'starlight' || device.color === 'silver'
  const chromeBg = isLight ? '#f0f0f0' : '#1e1e22'
  const urlBarBg = isLight ? '#fff' : '#2a2a2e'
  const border = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)'

  return (
    <div style={{ position: 'relative', width: 520, filter: `brightness(${cfg.brightness}) contrast(${cfg.contrast}) ${mat.deviceFilter}` }}>
      <div style={{ background: chromeBg, borderRadius: '12px 12px 0 0', border: `1px solid ${border}`, borderBottom: 'none', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((color, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />)}
          </div>
          <div style={{ height: 26, borderRadius: '6px 6px 0 0', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }} />
            <div style={{ width: 60, height: 8, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 10px' }}>
          {['←', '→'].map((a, i) => <div key={i} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: 0.5 }}>{a}</div>)}
          <div style={{ flex: 1, height: 28, background: urlBarBg, borderRadius: 6, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${border}`, opacity: 0.6 }} />
            <div style={{ flex: 1, height: 8, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
      </div>
      <div style={{ width: '100%', height: 340, background: '#fff', border: `1px solid ${border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', position: 'relative' }}>
        <Screen screenshot={screenshot} screenshotType={screenshotType} brightness={device.screenBrightness} reflection={device.showReflection} borderRadius={0} materialOverlay={mat.screenOverlay} offsetX={device.screenOffsetX} offsetY={device.screenOffsetY} scale={device.screenScale} />
      </div>
    </div>
  )
}

// ── Monitor ────────────────────────────────────────────────────────────────────

function MonitorMockup({ device, screenshot, screenshotType, lighting }: Omit<Props, 'transform'>) {
  const c = DEVICE_COLORS[device.color] ?? DEVICE_COLORS['space-black']
  const cfg = LIGHTING_CONFIGS[lighting.preset]
  const mat = MATERIAL_PRESETS[device.materialPreset ?? 'default']
  const isLight = device.color !== 'space-black'
  const border = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.07)'
  const hi = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', filter: `brightness(${cfg.brightness}) contrast(${cfg.contrast}) ${mat.deviceFilter}` }}>
      <div style={{ width: 440, background: `linear-gradient(160deg, ${c.frame} 0%, ${c.body} 60%, ${c.button} 100%)`, borderRadius: '14px 14px 6px 6px', border: `1px solid ${border}`, padding: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${hi} 0%, transparent 30%)`, pointerEvents: 'none' }} />
        {mat.bodyOverlay !== 'transparent' && <div style={{ position: 'absolute', inset: 0, background: mat.bodyOverlay, pointerEvents: 'none' }} />}
        <div style={{ width: '100%', height: 280, background: '#000', borderRadius: 6, overflow: 'hidden' }}>
          <Screen screenshot={screenshot} screenshotType={screenshotType} brightness={device.screenBrightness} reflection={device.showReflection} borderRadius={6} materialOverlay={mat.screenOverlay} offsetX={device.screenOffsetX} offsetY={device.screenOffsetY} scale={device.screenScale} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: 3, background: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)' }} />
        </div>
      </div>
      <div style={{ width: 36, height: 40, background: `linear-gradient(180deg, ${c.button} 0%, ${c.body} 100%)`, borderBottom: `3px solid ${c.button}` }} />
      <div style={{ width: 160, height: 14, background: `linear-gradient(180deg, ${c.body} 0%, ${c.button} 100%)`, borderRadius: '0 0 8px 8px', border: `1px solid ${border}`, borderTop: 'none' }} />
    </div>
  )
}

// ── Root export ────────────────────────────────────────────────────────────────

export default function DeviceMockup({ device, transform, screenshot, screenshotType, lighting }: Props) {
  const neonShadow = device.materialPreset === 'neon'
    ? `drop-shadow(0 0 20px rgba(100,120,255,0.7)) drop-shadow(0 0 40px rgba(100,120,255,0.4))`
    : ''

  const transformStyle = useMemo(() => ({
    transform: `rotateX(${transform.rotX}deg) rotateY(${transform.rotY}deg) rotateZ(${transform.rotZ}deg)`,
    transformStyle: 'preserve-3d' as const,
  }), [transform.rotX, transform.rotY, transform.rotZ])

  const lightingStyle = useMemo(() => {
    const shadowBlur = lighting.shadowSoftness ?? 60
    const shadowOpacity = lighting.shadowOpacity ?? 0.45
    const dropShadow = device.showShadow
      ? `drop-shadow(0 ${shadowBlur * 0.4}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`
      : ''
    return {
      filter: [dropShadow, neonShadow].filter(Boolean).join(' ') || 'none',
    }
  }, [device.showShadow, lighting.shadowSoftness, lighting.shadowOpacity, neonShadow])

  return (
    <div style={transformStyle}>
      <div style={lightingStyle}>
        {device.type === 'phone'   && <PhoneMockup   device={device} screenshot={screenshot} screenshotType={screenshotType} lighting={lighting} />}
        {device.type === 'laptop'  && <LaptopMockup  device={device} screenshot={screenshot} screenshotType={screenshotType} lighting={lighting} />}
        {device.type === 'tablet'  && <TabletMockup  device={device} screenshot={screenshot} screenshotType={screenshotType} lighting={lighting} />}
        {device.type === 'browser' && <BrowserMockup device={device} screenshot={screenshot} screenshotType={screenshotType} lighting={lighting} />}
        {device.type === 'monitor' && <MonitorMockup device={device} screenshot={screenshot} screenshotType={screenshotType} lighting={lighting} />}
      </div>
    </div>
  )
}
