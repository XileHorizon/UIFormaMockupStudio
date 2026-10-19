import { useState } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { useEditor } from '../store'
import type { LightingPreset, LightingConfig, BackgroundType, DeviceColor, MaterialPresetId } from '../types'
import { LIGHTING_CONFIGS, MATERIAL_PRESETS } from '../types'
import { Button, ButtonBlock, FieldRow, NumberField, SegmentedControl, SidebarSlider, SwatchGroup, TextArea } from '../kit'
import { ColorField, Hint, PropRow, Section, SwitchRow } from './studio-ui'

function Num({ label, value, step = 1, suffix, onChange }: { label: string; value: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return <NumberField label={label} value={value.toFixed(step < 1 ? 2 : 1)} step={step} supportingText={suffix} onChange={event => onChange(parseFloat(event.currentTarget.value) || 0)} />
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`
const deg = (v: number) => `${v.toFixed(0)}°`
const px = (v: number) => `${v}px`
const two = (v: number) => v.toFixed(2)

// ── Constants ─────────────────────────────────────────────────────────────────

const DEVICE_COLOR_OPTIONS: { id: DeviceColor; label: string; swatch: string }[] = [
  { id: 'midnight', label: 'Midnight', swatch: '#17191d' },
  { id: 'space-black', label: 'Space Black', swatch: '#1c1c1e' },
  { id: 'graphite', label: 'Graphite', swatch: '#55565a' },
  { id: 'silver', label: 'Silver', swatch: '#e8e8e8' },
  { id: 'starlight', label: 'Starlight', swatch: '#d7cfc1' },
  { id: 'gold', label: 'Gold', swatch: '#c7a979' },
  { id: 'red', label: 'Red', swatch: '#b7353f' },
  { id: 'orange', label: 'Orange', swatch: '#d66f35' },
  { id: 'yellow', label: 'Yellow', swatch: '#d9b83e' },
  { id: 'green', label: 'Green', swatch: '#4f8b67' },
  { id: 'blue', label: 'Blue', swatch: '#527fa8' },
  { id: 'purple', label: 'Purple', swatch: '#745b9a' },
  { id: 'pink', label: 'Pink', swatch: '#c77b91' },
]

const BG_OPTIONS: { type: BackgroundType; label: string }[] = [
  { type: 'transparent', label: 'None' }, { type: 'solid', label: 'Solid' },
  { type: 'gradient-linear', label: 'Linear' }, { type: 'gradient-radial', label: 'Radial' },
  { type: 'blob', label: 'Blob' }, { type: 'grid', label: 'Grid' },
]

const LIGHTING_RIGS: Record<LightingPreset, Partial<LightingConfig>> = {
  'soft-studio': { keyIntensity: 0.88, fillIntensity: 0.24, rimIntensity: 0.58, environmentIntensity: 0.26, environmentRotation: -26, colorTemperature: 5200, keyAzimuth: -35, keyElevation: 42 },
  'bright-product': { keyIntensity: 1.35, fillIntensity: 0.5, rimIntensity: 0.4, environmentIntensity: 0.48, environmentRotation: 15, colorTemperature: 6000, keyAzimuth: -25, keyElevation: 55 },
  'dark-dramatic': { keyIntensity: 1.15, fillIntensity: 0.06, rimIntensity: 1.05, environmentIntensity: 0.1, environmentRotation: -65, colorTemperature: 4300, keyAzimuth: -55, keyElevation: 28 },
  'cool-technology': { keyIntensity: 0.92, fillIntensity: 0.34, rimIntensity: 0.86, environmentIntensity: 0.24, environmentRotation: 45, colorTemperature: 7600, keyAzimuth: -18, keyElevation: 35 },
  'warm-editorial': { keyIntensity: 1.08, fillIntensity: 0.2, rimIntensity: 0.32, environmentIntensity: 0.3, environmentRotation: -10, colorTemperature: 3600, keyAzimuth: -48, keyElevation: 48 },
  'minimal-portfolio': { keyIntensity: 0.72, fillIntensity: 0.28, rimIntensity: 0.14, environmentIntensity: 0.42, environmentRotation: 0, colorTemperature: 5600, keyAzimuth: -30, keyElevation: 62 },
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RightSidebar() {
  const { state, selectedObject, updateDevice, updateTransform, updateText, updateShape, setBackground, setLighting } = useEditor()
  const { background, lighting } = state

  const [open, setOpen] = useState({ transform: true, element: true, material: false, lighting: true, shadow: false, background: true })
  const section = (k: keyof typeof open) => ({ open: open[k], onOpenChange: (next: boolean) => setOpen(s => ({ ...s, [k]: next })) })

  const sel = selectedObject
  const selId = sel?.id ?? null
  const t = sel?.transform
  const d = sel?.device
  const et = sel?.elementType ?? 'device'
  const deviceSwatch = DEVICE_COLOR_OPTIONS.find(c => c.id === d?.color)?.swatch

  return (
    <aside className="studio-panel" style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--border)' }}>
      {sel && t && typeof t.rotX === 'number' ? (
        <>
          <Section title="Transform" spacing="tight" {...section('transform')}>
            <FieldRow>
              <Num label="Rot X" value={t.rotX} suffix="°" onChange={v => updateTransform(selId!, { rotX: v })} />
              <Num label="Rot Y" value={t.rotY} suffix="°" onChange={v => updateTransform(selId!, { rotY: v })} />
              <Num label="Rot Z" value={t.rotZ} suffix="°" onChange={v => updateTransform(selId!, { rotZ: v })} />
            </FieldRow>
            <FieldRow>
              <Num label="Pos X" value={t.posX} onChange={v => updateTransform(selId!, { posX: v })} />
              <Num label="Pos Y" value={t.posY} onChange={v => updateTransform(selId!, { posY: v })} />
              <Num label="Pos Z" value={t.posZ ?? 0} onChange={v => updateTransform(selId!, { posZ: v })} />
            </FieldRow>
            <FieldRow>
              <Num label="Scale" value={t.scale} step={0.1} onChange={v => updateTransform(selId!, { scale: Math.max(0.1, v) })} />
            </FieldRow>
          </Section>

          {et === 'device' && d?.type && (
            <>
              <Section title="Device" {...section('element')}>
                <SwatchGroup
                  label={`Color · ${DEVICE_COLOR_OPTIONS.find(c => c.id === d.color)?.label ?? 'Custom'}`}
                  colors={DEVICE_COLOR_OPTIONS.map(c => c.swatch)}
                  value={deviceSwatch}
                  onValueChange={hex => { const option = DEVICE_COLOR_OPTIONS.find(c => c.swatch === hex); if (option) updateDevice(selId!, { color: option.id }) }}
                />
                {d.type === 'ipad-pro' && (
                  <PropRow label="Orientation">
                    <SegmentedControl label="Orientation" value={d.orientation} onValueChange={v => updateDevice(selId!, { orientation: v })} items={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
                  </PropRow>
                )}
                <SwitchRow label="Shadow" checked={d.showShadow} onCheckedChange={v => updateDevice(selId!, { showShadow: v })} />
                <SwitchRow label="Reflection" checked={d.showReflection} onCheckedChange={v => updateDevice(selId!, { showReflection: v })} />
                <SidebarSlider label="Brightness" value={d.screenBrightness} min={0.3} max={1.5} step={0.01} formatValue={pct} onValueChange={v => updateDevice(selId!, { screenBrightness: v })} />
                {sel.screenshot && <>
                  <SidebarSlider label="Image X" value={d.screenOffsetX ?? 0} min={-100} max={100} step={1} formatValue={v => `${v.toFixed(0)}%`} onValueChange={v => updateDevice(selId!, { screenOffsetX: v })} />
                  <SidebarSlider label="Image Y" value={d.screenOffsetY ?? 0} min={-100} max={100} step={1} formatValue={v => `${v.toFixed(0)}%`} onValueChange={v => updateDevice(selId!, { screenOffsetY: v })} />
                  <SidebarSlider label="Image zoom" value={d.screenScale ?? 1} min={0.5} max={3} step={0.01} formatValue={v => `${v.toFixed(2)}×`} onValueChange={v => updateDevice(selId!, { screenScale: v })} />
                  <PropRow label="Image fit"><Button appearance="surface" size="compact" leadingIcon={<IconRefresh />} onClick={() => updateDevice(selId!, { screenOffsetX: 0, screenOffsetY: 0, screenScale: 1 })}>Reset</Button></PropRow>
                </>}
              </Section>

              <Section title="Material" {...section('material')}>
                <ButtonBlock
                  label="Material"
                  value={d.materialPreset ?? 'default'}
                  onValueChange={id => updateDevice(selId!, { materialPreset: id })}
                  items={(Object.keys(MATERIAL_PRESETS) as MaterialPresetId[]).map(id => ({ value: id, label: MATERIAL_PRESETS[id].label }))}
                />
              </Section>
            </>
          )}

          {et === 'text' && sel.textConfig && (
            <Section title="Text" {...section('element')}>
              <TextArea label="Content" rows={3} value={sel.textConfig.content} onChange={e => updateText(selId!, { content: e.currentTarget.value })} />
              <ColorField label="Color" value={sel.textConfig.color} onChange={v => updateText(selId!, { color: v })} />
              <SidebarSlider label="Size" value={sel.textConfig.fontSize} min={12} max={200} step={1} formatValue={px} onValueChange={v => updateText(selId!, { fontSize: v })} />
              <PropRow label="Weight">
                <SegmentedControl label="Weight" value={String(sel.textConfig.fontWeight)} onValueChange={v => updateText(selId!, { fontWeight: parseInt(v) as typeof sel.textConfig.fontWeight })} items={[{ value: '300', label: 'Lt' }, { value: '400', label: 'Rg' }, { value: '500', label: 'Md' }, { value: '700', label: 'Bd' }, { value: '800', label: 'Bk' }]} />
              </PropRow>
              <PropRow label="Font">
                <SegmentedControl label="Font" value={sel.textConfig.fontFamily} onValueChange={v => updateText(selId!, { fontFamily: v })} items={[{ value: 'sans', label: 'Sans' }, { value: 'serif', label: 'Serif' }, { value: 'mono', label: 'Mono' }]} />
              </PropRow>
              <PropRow label="Align">
                <SegmentedControl label="Align" value={sel.textConfig.align} onValueChange={v => updateText(selId!, { align: v })} items={[{ value: 'left', label: 'L' }, { value: 'center', label: 'C' }, { value: 'right', label: 'R' }]} />
              </PropRow>
              <SidebarSlider label="Tracking" value={sel.textConfig.letterSpacing} min={-0.1} max={0.3} step={0.005} formatValue={v => `${v.toFixed(3)}em`} onValueChange={v => updateText(selId!, { letterSpacing: v })} />
              <SidebarSlider label="Leading" value={sel.textConfig.lineHeight} min={0.8} max={2.5} step={0.05} formatValue={two} onValueChange={v => updateText(selId!, { lineHeight: v })} />
              <SidebarSlider label="Max width" value={sel.textConfig.maxWidth} min={100} max={800} step={10} formatValue={px} onValueChange={v => updateText(selId!, { maxWidth: v })} />
              <SidebarSlider label="Opacity" value={sel.textConfig.opacity} min={0} max={1} step={0.01} formatValue={pct} onValueChange={v => updateText(selId!, { opacity: v })} />
            </Section>
          )}

          {et === 'shape' && sel.shapeConfig && (
            <Section title="Shape" {...section('element')}>
              <ColorField label="Color" value={sel.shapeConfig.color} onChange={v => updateShape(selId!, { color: v })} />
              <ColorField label="Color 2" value={sel.shapeConfig.secondaryColor} onChange={v => updateShape(selId!, { secondaryColor: v })} />
              <SidebarSlider label="Width" value={sel.shapeConfig.width} min={40} max={800} step={4} formatValue={px} onValueChange={v => updateShape(selId!, { width: v })} />
              <SidebarSlider label="Height" value={sel.shapeConfig.height} min={40} max={800} step={4} formatValue={px} onValueChange={v => updateShape(selId!, { height: v })} />
              {sel.shapeConfig.shape !== 'ring' && sel.shapeConfig.shape !== 'blob' && sel.shapeConfig.shape !== 'pedestal' && (
                <SidebarSlider label="Radius" value={sel.shapeConfig.borderRadius} min={0} max={120} step={1} formatValue={px} onValueChange={v => updateShape(selId!, { borderRadius: v })} />
              )}
              <SidebarSlider label="Blur" value={sel.shapeConfig.blur} min={0} max={40} step={0.5} formatValue={px} onValueChange={v => updateShape(selId!, { blur: v })} />
              <SidebarSlider label="Opacity" value={sel.shapeConfig.opacity} min={0} max={1} step={0.01} formatValue={pct} onValueChange={v => updateShape(selId!, { opacity: v })} />
              <SwitchRow label="Shadow" checked={sel.shapeConfig.showShadow} onCheckedChange={v => updateShape(selId!, { showShadow: v })} />
            </Section>
          )}
        </>
      ) : (
        <div style={{ padding: '0 14px' }}><Hint>Select an object to edit its transform, material, and screen.</Hint></div>
      )}

      <Section title="Lighting" {...section('lighting')}>
        <ButtonBlock
          label="Lighting preset"
          value={lighting.preset}
          onValueChange={preset => setLighting({ preset, ...LIGHTING_RIGS[preset] })}
          items={(Object.keys(LIGHTING_CONFIGS) as LightingPreset[]).map(preset => ({ value: preset, label: preset === 'minimal-portfolio' ? 'Minimal' : LIGHTING_CONFIGS[preset].label }))}
        />
        <SidebarSlider label="Key" value={lighting.keyIntensity ?? 0.88} min={0} max={3} step={0.01} formatValue={two} onValueChange={v => setLighting({ keyIntensity: v })} />
        <SidebarSlider label="Fill" value={lighting.fillIntensity ?? 0.24} min={0} max={2} step={0.01} formatValue={two} onValueChange={v => setLighting({ fillIntensity: v })} />
        <SidebarSlider label="Rim" value={lighting.rimIntensity ?? 0.58} min={0} max={3} step={0.01} formatValue={two} onValueChange={v => setLighting({ rimIntensity: v })} />
        <SidebarSlider label="Environment" value={lighting.environmentIntensity ?? 0.26} min={0} max={2} step={0.01} formatValue={two} onValueChange={v => setLighting({ environmentIntensity: v })} />
        <SidebarSlider label="HDRI rotate" value={lighting.environmentRotation ?? -26} min={-180} max={180} step={1} formatValue={deg} onValueChange={v => setLighting({ environmentRotation: v })} />
        <SidebarSlider label="Temperature" value={lighting.colorTemperature ?? 5200} min={2800} max={9000} step={100} formatValue={v => `${v.toFixed(0)}K`} onValueChange={v => setLighting({ colorTemperature: v })} />
        <SidebarSlider label="Key around" value={lighting.keyAzimuth ?? -35} min={-180} max={180} step={1} formatValue={deg} onValueChange={v => setLighting({ keyAzimuth: v })} />
        <SidebarSlider label="Key height" value={lighting.keyElevation ?? 42} min={5} max={85} step={1} formatValue={deg} onValueChange={v => setLighting({ keyElevation: v })} />
      </Section>

      <Section title="Shadow" {...section('shadow')}>
        <SidebarSlider label="Softness" value={lighting.shadowSoftness} min={10} max={160} step={1} formatValue={v => `${v.toFixed(0)}px`} onValueChange={v => setLighting({ shadowSoftness: v })} />
        <SidebarSlider label="Opacity" value={lighting.shadowOpacity} min={0} max={1} step={0.01} formatValue={pct} onValueChange={v => setLighting({ shadowOpacity: v })} />
        <SwitchRow label="Rim light" checked={lighting.rimLight} onCheckedChange={v => setLighting({ rimLight: v })} />
        <SwitchRow label="Contact" checked={lighting.contactShadow} onCheckedChange={v => setLighting({ contactShadow: v })} />
      </Section>

      <Section title="Background" {...section('background')}>
        <ButtonBlock className="studio-block-3" label="Background type" value={background.type} onValueChange={type => setBackground({ type })} items={BG_OPTIONS.map(opt => ({ value: opt.type, label: opt.label }))} />
        {background.type === 'solid' && <ColorField label="Color" value={background.color} onChange={v => setBackground({ color: v })} />}
        {(background.type === 'gradient-linear' || background.type === 'gradient-radial' || background.type === 'blob') && (
          <>
            <ColorField label="From" value={background.gradientFrom} onChange={v => setBackground({ gradientFrom: v })} />
            <ColorField label="To" value={background.gradientTo} onChange={v => setBackground({ gradientTo: v })} />
            {background.type === 'gradient-linear' && <SidebarSlider label="Angle" value={background.gradientAngle} min={0} max={360} step={1} formatValue={deg} onValueChange={v => setBackground({ gradientAngle: v })} />}
            {background.type === 'blob' && <ColorField label="Base" value={background.color} onChange={v => setBackground({ color: v })} />}
          </>
        )}
      </Section>
    </aside>
  )
}
