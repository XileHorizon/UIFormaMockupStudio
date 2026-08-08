import { useEditor } from '../store'
import type { LayoutModifier, MirrorLayoutSettings, PatternAxis, RadialLayoutSettings } from '../types'

const fieldStyle = { width: '100%', padding: 5, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 10 }
const buttonStyle = { padding: '6px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10 }

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label style={{ display: 'grid', gridTemplateColumns: '56px 1fr 38px', gap: 5, alignItems: 'center', marginTop: 7, fontSize: 9, color: 'var(--text-dim)' }}>
    <span>{label}</span><input type="range" value={value} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} /><span style={{ textAlign: 'right' }}>{value}</span>
  </label>
}

function ModifierEditor({ modifier }: { modifier: LayoutModifier }) {
  const { updateLayoutModifier, removeLayoutModifier } = useEditor()
  const setSettings = (settings: LayoutModifier['settings']) => updateLayoutModifier(modifier.id, { settings })
  if (modifier.type === 'radial') {
    const settings = modifier.settings as RadialLayoutSettings
    return <div style={{ marginTop: 7, padding: 8, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--accent)' }}><strong>Radius / Radial</strong><span>{modifier.sourceIds.length} source{modifier.sourceIds.length === 1 ? '' : 's'}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 7 }}>
        <label style={{ fontSize: 9, color: 'var(--text-dim)' }}>Axis<select style={fieldStyle} value={settings.axis} onChange={event => setSettings({ ...settings, axis: event.target.value as PatternAxis })}><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select></label>
        <label style={{ fontSize: 9, color: 'var(--text-dim)' }}>Orientation<select style={fieldStyle} value={settings.orientation} onChange={event => setSettings({ ...settings, orientation: event.target.value as 'follow' | 'preserve' })}><option value="follow">Rotate with path</option><option value="preserve">Keep original</option></select></label>
      </div>
      <Slider label="Count" value={settings.count} min={1} max={128} onChange={count => setSettings({ ...settings, count })} />
      <Slider label="Angle" value={settings.angle} min={-360} max={360} onChange={angle => setSettings({ ...settings, angle })} />
      <Slider label="Start" value={settings.startAngle} min={-1440} max={1440} onChange={startAngle => setSettings({ ...settings, startAngle })} />
      <Slider label="Radius +" value={settings.radiusOffset} min={-500} max={1000} onChange={radiusOffset => setSettings({ ...settings, radiusOffset })} />
      <div style={{ display: 'flex', gap: 5, marginTop: 7 }}><button style={buttonStyle} onClick={() => setSettings({ ...settings, direction: settings.direction === 1 ? -1 : 1 })}>{settings.direction === 1 ? '↻ Clockwise' : '↺ Counterclockwise'}</button><button style={{ ...buttonStyle, color: '#ef7777', marginLeft: 'auto' }} onClick={() => removeLayoutModifier(modifier.id)}>Remove</button></div>
    </div>
  }
  const settings = modifier.settings as MirrorLayoutSettings
  return <div style={{ marginTop: 7, padding: 8, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--accent)' }}><strong>Mirror</strong><span>{modifier.sourceIds.length} source{modifier.sourceIds.length === 1 ? '' : 's'}</span></div>
    <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>{(['x', 'y', 'z'] as PatternAxis[]).map(axis => <button key={axis} style={{ ...buttonStyle, flex: 1, borderColor: settings.axes.includes(axis) ? 'var(--accent)' : 'var(--border)', color: settings.axes.includes(axis) ? 'var(--accent)' : 'var(--text-muted)' }} onClick={() => setSettings({ ...settings, axes: settings.axes.includes(axis) ? settings.axes.filter(value => value !== axis) : [...settings.axes, axis] })}>{axis.toUpperCase()} {settings.axes.includes(axis) ? '✓' : ''}</button>)}</div>
    <button style={{ ...buttonStyle, color: '#ef7777', marginTop: 8, width: '100%' }} onClick={() => removeLayoutModifier(modifier.id)}>Remove Mirror</button>
  </div>
}

export default function AutoLayoutPanel() {
  const { state, addLayoutModifier } = useEditor()
  const selectedCount = state.selectedIds?.length ?? (state.selectedId ? 1 : 0)
  return <div style={{ padding: '0 10px 10px' }}>
    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 7 }}>{selectedCount ? `${selectedCount} selected · Shift-click to add sources` : 'Select one or more source objects'}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
      <button disabled={!selectedCount} style={{ ...buttonStyle, opacity: selectedCount ? 1 : .45 }} onClick={() => addLayoutModifier('radial')}>◎ Radius</button>
      <button disabled={!selectedCount} style={{ ...buttonStyle, opacity: selectedCount ? 1 : .45 }} onClick={() => addLayoutModifier('mirror')}>◁▷ Mirror</button>
    </div>
    {(state.layouts ?? []).map(modifier => <ModifierEditor key={modifier.id} modifier={modifier} />)}
  </div>
}
