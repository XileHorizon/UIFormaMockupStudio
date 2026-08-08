import { useState } from 'react'
import { useEditor } from '../store'
import type { LightingPreset, BackgroundType, DeviceColor, MaterialPresetId } from '../types'
import { LIGHTING_CONFIGS, MATERIAL_PRESETS } from '../types'

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionLabel({ children, collapsible, open, onToggle }: { children: React.ReactNode; collapsible?: boolean; open?: boolean; onToggle?: () => void }) {
  return (
    <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: collapsible ? 'pointer' : 'default' }} onClick={collapsible ? onToggle : undefined}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{children}</span>
      {collapsible && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}><path d="M2 4l3 3 3-3" /></svg>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 14px', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 76, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function Slider({ value, min, max, step = 0.01, onChange, fmt }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 36, textAlign: 'right' }}>{fmt ? fmt(value) : value.toFixed(2)}</span>
    </div>
  )
}

function NumberInput({ value, onChange, step = 1, suffix = '' }: { value: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <input type="number" value={value.toFixed(step < 1 ? 2 : 1)} step={step} onChange={e => onChange(parseFloat(e.target.value) || 0)} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 6px', outline: 'none', width: '100%' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      />
      {suffix && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{suffix}</span>}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 32, height: 18, borderRadius: 9, background: value ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid ' + (value ? 'var(--accent)' : 'var(--border)'), cursor: 'pointer', position: 'relative', transition: 'all 0.15s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: value ? 15 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="color" value={value.startsWith('rgba') ? '#ffffff' : value} onChange={e => onChange(e.target.value)} style={{ width: 32, height: 26, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', padding: 2 }} />
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{value.startsWith('rgba') ? value.slice(0, 20) + '…' : value.toUpperCase()}</span>
    </div>
  )
}

function ColorSwatch({ color, selected, onClick, title }: { color: string; selected: boolean; onClick: () => void; title: string }) {
  return <div title={title} onClick={onClick} style={{ width: 20, height: 20, borderRadius: '50%', background: color, cursor: 'pointer', border: selected ? '2px solid var(--accent)' : '2px solid transparent', outline: selected ? '1px solid var(--accent)' : 'none', flexShrink: 0 }} />
}

function Sep() { return <div style={{ height: 1, background: 'var(--border-subtle)' }} /> }

function ChipRow<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '2px 14px' }}>
      {options.map(opt => (
        <button key={opt.id} onClick={() => onChange(opt.id)} style={{ padding: '5px 8px', borderRadius: 5, border: value === opt.id ? '1px solid var(--accent)' : '1px solid var(--border)', background: value === opt.id ? 'var(--accent-glow)' : 'var(--surface)', color: value === opt.id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEVICE_COLOR_OPTIONS: { id: DeviceColor; label: string; swatch: string }[] = [
  { id: 'space-black', label: 'Space Black', swatch: '#1c1c1e' },
  { id: 'silver', label: 'Silver', swatch: '#e8e8e8' },
  { id: 'white', label: 'White', swatch: '#f5f5f7' },
  { id: 'gold', label: 'Gold', swatch: '#f5e6c8' },
  { id: 'blue', label: 'Blue', swatch: '#6f98b8' },
  { id: 'orange', label: 'Orange', swatch: '#e58b5b' },
]

const BG_OPTIONS: { type: BackgroundType; label: string }[] = [
  { type: 'transparent', label: 'None' }, { type: 'solid', label: 'Solid' },
  { type: 'gradient-linear', label: 'Linear' }, { type: 'gradient-radial', label: 'Radial' },
  { type: 'blob', label: 'Blob' }, { type: 'grid', label: 'Grid' },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function RightSidebar() {
  const { state, selectedObject, updateDevice, updateTransform, updateText, updateShape, setBackground, setLighting } = useEditor()
  const { background, lighting } = state

  const [open, setOpen] = useState({ transform: true, element: true, material: false, lighting: true, shadow: false, background: true })
  const toggle = (k: keyof typeof open) => setOpen(s => ({ ...s, [k]: !s[k] }))

  const sel = selectedObject
  const selId = sel?.id ?? null
  const t = sel?.transform
  const d = sel?.device
  const et = sel?.elementType ?? 'device'

  return (
    <div style={{ width: 256, flexShrink: 0, background: 'var(--panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>

      {sel && t && typeof t.rotX === 'number' ? (
        <>
          {/* Transform */}
          <SectionLabel collapsible open={open.transform} onToggle={() => toggle('transform')}>Transform</SectionLabel>
          {open.transform && (
            <div style={{ paddingBottom: 10 }}>
              <div style={{ padding: '4px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
                  {(['rotX', 'rotY', 'rotZ'] as const).map((k, i) => (
                    <div key={k}>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Rot {['X','Y','Z'][i]}</div>
                      <NumberInput value={t[k]} step={1} suffix="°" onChange={v => updateTransform(selId!, { [k]: v })} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                  <div><div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Pos X</div><NumberInput value={t.posX} onChange={v => updateTransform(selId!, { posX: v })} /></div>
                  <div><div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Pos Y</div><NumberInput value={t.posY} onChange={v => updateTransform(selId!, { posY: v })} /></div>
                  <div><div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Scale</div><NumberInput value={t.scale} step={0.1} onChange={v => updateTransform(selId!, { scale: Math.max(0.1, v) })} /></div>
                </div>
              </div>
            </div>
          )}

          <Sep />

          {/* Element-specific properties */}
          {et === 'device' && d?.type && (
            <>
              <SectionLabel collapsible open={open.element} onToggle={() => toggle('element')}>Device</SectionLabel>
              {open.element && (
                <div style={{ paddingBottom: 10 }}>
                  <Row label="Color">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {DEVICE_COLOR_OPTIONS.map(c => <ColorSwatch key={c.id} color={c.swatch} title={c.label} selected={d.color === c.id} onClick={() => updateDevice(selId!, { color: c.id })} />)}
                    </div>
                  </Row>
                  {d.type === 'tablet' && (
                    <Row label="Orientation">
                      <ChipRow options={[{ id: 'portrait', label: 'Port' }, { id: 'landscape', label: 'Land' }]} value={d.orientation} onChange={v => updateDevice(selId!, { orientation: v })} />
                    </Row>
                  )}
                  <Row label="Shadow"><Toggle value={d.showShadow} onChange={v => updateDevice(selId!, { showShadow: v })} /></Row>
                  <Row label="Reflection"><Toggle value={d.showReflection} onChange={v => updateDevice(selId!, { showReflection: v })} /></Row>
                  <Row label="Brightness"><Slider value={d.screenBrightness} min={0.3} max={1.5} fmt={v => `${(v * 100).toFixed(0)}%`} onChange={v => updateDevice(selId!, { screenBrightness: v })} /></Row>
                </div>
              )}

              <Sep />

              {/* Material presets */}
              <SectionLabel collapsible open={open.material} onToggle={() => toggle('material')}>Material</SectionLabel>
              {open.material && (
                <div style={{ paddingBottom: 10 }}>
                  <div style={{ padding: '4px 10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                    {(Object.keys(MATERIAL_PRESETS) as MaterialPresetId[]).map(id => {
                      const mat = MATERIAL_PRESETS[id]
                      const isActive = (d.materialPreset ?? 'default') === id
                      return (
                        <button key={id} onClick={() => updateDevice(selId!, { materialPreset: id })}
                          style={{ padding: '7px 4px', borderRadius: 6, border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)', background: isActive ? 'var(--accent-glow)' : 'var(--surface)', color: isActive ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)', textAlign: 'center', transition: 'all 0.1s' }}
                          onMouseEnter={e => { if (!isActive) { (e.currentTarget).style.background = 'var(--surface-2)'; (e.currentTarget).style.color = 'var(--text)' } }}
                          onMouseLeave={e => { if (!isActive) { (e.currentTarget).style.background = 'var(--surface)'; (e.currentTarget).style.color = 'var(--text-muted)' } }}
                        >
                          {mat.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <Sep />
            </>
          )}

          {et === 'text' && sel.textConfig && (
            <>
              <SectionLabel collapsible open={open.element} onToggle={() => toggle('element')}>Text</SectionLabel>
              {open.element && (
                <div style={{ paddingBottom: 10 }}>
                  <div style={{ padding: '4px 14px 8px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Content</div>
                    <textarea
                      value={sel.textConfig.content}
                      onChange={e => updateText(selId!, { content: e.target.value })}
                      rows={3}
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '6px 8px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                    />
                  </div>
                  <Row label="Color"><ColorPicker value={sel.textConfig.color} onChange={v => updateText(selId!, { color: v })} /></Row>
                  <Row label="Size">
                    <Slider value={sel.textConfig.fontSize} min={12} max={200} step={1} fmt={v => `${v}px`} onChange={v => updateText(selId!, { fontSize: v })} />
                  </Row>
                  <Row label="Weight">
                    <ChipRow options={[{ id: '300', label: 'Light' }, { id: '400', label: 'Regular' }, { id: '500', label: 'Medium' }, { id: '700', label: 'Bold' }, { id: '800', label: 'Black' }] as any} value={String(sel.textConfig.fontWeight) as any} onChange={(v: any) => updateText(selId!, { fontWeight: parseInt(v) as any })} />
                  </Row>
                  <Row label="Font">
                    <ChipRow options={[{ id: 'sans', label: 'Sans' }, { id: 'serif', label: 'Serif' }, { id: 'mono', label: 'Mono' }]} value={sel.textConfig.fontFamily} onChange={v => updateText(selId!, { fontFamily: v })} />
                  </Row>
                  <Row label="Align">
                    <ChipRow options={[{ id: 'left', label: 'L' }, { id: 'center', label: 'C' }, { id: 'right', label: 'R' }]} value={sel.textConfig.align} onChange={v => updateText(selId!, { align: v })} />
                  </Row>
                  <Row label="Tracking">
                    <Slider value={sel.textConfig.letterSpacing} min={-0.1} max={0.3} step={0.005} fmt={v => `${v.toFixed(3)}em`} onChange={v => updateText(selId!, { letterSpacing: v })} />
                  </Row>
                  <Row label="Leading">
                    <Slider value={sel.textConfig.lineHeight} min={0.8} max={2.5} step={0.05} fmt={v => v.toFixed(2)} onChange={v => updateText(selId!, { lineHeight: v })} />
                  </Row>
                  <Row label="Max width">
                    <Slider value={sel.textConfig.maxWidth} min={100} max={800} step={10} fmt={v => `${v}px`} onChange={v => updateText(selId!, { maxWidth: v })} />
                  </Row>
                  <Row label="Opacity">
                    <Slider value={sel.textConfig.opacity} min={0} max={1} fmt={v => `${(v * 100).toFixed(0)}%`} onChange={v => updateText(selId!, { opacity: v })} />
                  </Row>
                </div>
              )}
              <Sep />
            </>
          )}

          {et === 'shape' && sel.shapeConfig && (
            <>
              <SectionLabel collapsible open={open.element} onToggle={() => toggle('element')}>Shape</SectionLabel>
              {open.element && (
                <div style={{ paddingBottom: 10 }}>
                  <Row label="Color"><ColorPicker value={sel.shapeConfig.color} onChange={v => updateShape(selId!, { color: v })} /></Row>
                  <Row label="Color 2"><ColorPicker value={sel.shapeConfig.secondaryColor} onChange={v => updateShape(selId!, { secondaryColor: v })} /></Row>
                  <Row label="Width">
                    <Slider value={sel.shapeConfig.width} min={40} max={800} step={4} fmt={v => `${v}px`} onChange={v => updateShape(selId!, { width: v })} />
                  </Row>
                  <Row label="Height">
                    <Slider value={sel.shapeConfig.height} min={40} max={800} step={4} fmt={v => `${v}px`} onChange={v => updateShape(selId!, { height: v })} />
                  </Row>
                  {sel.shapeConfig.shape !== 'ring' && sel.shapeConfig.shape !== 'blob' && sel.shapeConfig.shape !== 'pedestal' && (
                    <Row label="Radius">
                      <Slider value={sel.shapeConfig.borderRadius} min={0} max={120} step={1} fmt={v => `${v}px`} onChange={v => updateShape(selId!, { borderRadius: v })} />
                    </Row>
                  )}
                  <Row label="Blur">
                    <Slider value={sel.shapeConfig.blur} min={0} max={40} step={0.5} fmt={v => `${v}px`} onChange={v => updateShape(selId!, { blur: v })} />
                  </Row>
                  <Row label="Opacity">
                    <Slider value={sel.shapeConfig.opacity} min={0} max={1} fmt={v => `${(v * 100).toFixed(0)}%`} onChange={v => updateShape(selId!, { opacity: v })} />
                  </Row>
                  <Row label="Shadow"><Toggle value={sel.shapeConfig.showShadow} onChange={v => updateShape(selId!, { showShadow: v })} /></Row>
                </div>
              )}
              <Sep />
            </>
          )}
        </>
      ) : (
        <div style={{ padding: '20px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>Select an object<br />to edit properties</div>
        </div>
      )}

      {/* Scene-level: Lighting */}
      <SectionLabel collapsible open={open.lighting} onToggle={() => toggle('lighting')}>Lighting</SectionLabel>
      {open.lighting && (
        <div style={{ paddingBottom: 10 }}>
          <div style={{ padding: '0 10px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {(Object.keys(LIGHTING_CONFIGS) as LightingPreset[]).map(preset => (
              <button key={preset} onClick={() => setLighting({ preset })}
                style={{ padding: '7px 6px', borderRadius: 6, border: lighting.preset === preset ? '1px solid var(--accent)' : '1px solid var(--border)', background: lighting.preset === preset ? 'var(--accent-glow)' : 'var(--surface)', color: lighting.preset === preset ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', textAlign: 'center' }}
                onMouseEnter={e => { if (lighting.preset !== preset) { (e.currentTarget).style.background = 'var(--surface-2)'; (e.currentTarget).style.color = 'var(--text)' } }}
                onMouseLeave={e => { if (lighting.preset !== preset) { (e.currentTarget).style.background = 'var(--surface)'; (e.currentTarget).style.color = 'var(--text-muted)' } }}
              >
                {LIGHTING_CONFIGS[preset].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Sep />

      {/* Shadow controls */}
      <SectionLabel collapsible open={open.shadow} onToggle={() => toggle('shadow')}>Shadow</SectionLabel>
      {open.shadow && (
        <div style={{ paddingBottom: 10 }}>
          <Row label="Softness"><Slider value={lighting.shadowSoftness} min={10} max={160} step={1} fmt={v => `${v.toFixed(0)}px`} onChange={v => setLighting({ shadowSoftness: v })} /></Row>
          <Row label="Opacity"><Slider value={lighting.shadowOpacity} min={0} max={1} fmt={v => `${(v * 100).toFixed(0)}%`} onChange={v => setLighting({ shadowOpacity: v })} /></Row>
          <Row label="Rim light"><Toggle value={lighting.rimLight} onChange={v => setLighting({ rimLight: v })} /></Row>
          <Row label="Contact"><Toggle value={lighting.contactShadow} onChange={v => setLighting({ contactShadow: v })} /></Row>
        </div>
      )}

      <Sep />

      {/* Background */}
      <SectionLabel collapsible open={open.background} onToggle={() => toggle('background')}>Background</SectionLabel>
      {open.background && (
        <div style={{ paddingBottom: 14 }}>
          <div style={{ padding: '4px 10px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {BG_OPTIONS.map(opt => (
              <button key={opt.type} onClick={() => setBackground({ type: opt.type })}
                style={{ padding: '5px 8px', borderRadius: 5, border: background.type === opt.type ? '1px solid var(--accent)' : '1px solid var(--border)', background: background.type === opt.type ? 'var(--accent-glow)' : 'var(--surface)', color: background.type === opt.type ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {background.type === 'solid' && <Row label="Color"><ColorPicker value={background.color} onChange={v => setBackground({ color: v })} /></Row>}
          {(background.type === 'gradient-linear' || background.type === 'gradient-radial' || background.type === 'blob') && (
            <>
              <Row label="From"><ColorPicker value={background.gradientFrom} onChange={v => setBackground({ gradientFrom: v })} /></Row>
              <Row label="To"><ColorPicker value={background.gradientTo} onChange={v => setBackground({ gradientTo: v })} /></Row>
              {background.type === 'gradient-linear' && <Row label="Angle"><Slider value={background.gradientAngle} min={0} max={360} step={1} fmt={v => `${v.toFixed(0)}°`} onChange={v => setBackground({ gradientAngle: v })} /></Row>}
              {background.type === 'blob' && <Row label="Base"><ColorPicker value={background.color} onChange={v => setBackground({ color: v })} /></Row>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
