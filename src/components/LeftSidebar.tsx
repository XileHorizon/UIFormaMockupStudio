import { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { useEditor } from '../store'
import type { DeviceType, AnglePreset, SceneObject, ShapeType, LayoutPattern, DeviceColor } from '../types'
import { ANGLE_PRESETS } from '../types'

const DEVICE_TYPES: { type: DeviceType; label: string }[] = [
  { type: 'studio-display', label: 'Studio Display' },
  { type: 'macbook-air',    label: 'MacBook Air'    },
  { type: 'iphone-17-pro',   label: 'iPhone 17 Pro'  },
  { type: 'ipad-pro',        label: 'iPad Pro'        },
  { type: 'laptop-3d',       label: 'Laptop 3D'       },
  { type: 'imac-2021',       label: 'iMac 2021'       },
  { type: 'phone',          label: 'Phone'          },
  { type: 'laptop',         label: 'Laptop'         },
  { type: 'tablet',         label: 'Tablet'         },
  { type: 'browser',        label: 'Browser'        },
  { type: 'monitor',        label: 'Monitor'        },
]

const SHAPE_TYPES: { type: ShapeType; label: string }[] = [
  { type: 'card',     label: 'Card'     },
  { type: 'ring',     label: 'Ring'     },
  { type: 'blob',     label: 'Blob'     },
  { type: 'pedestal', label: 'Pedestal' },
  { type: 'plane',    label: 'Plane'    },
]

const ANGLE_LABELS: Record<AnglePreset, string> = {
  front: 'Front', 'slight-left': 'Slight L', 'slight-right': 'Slight R',
  'top-down': 'Top Down', 'iso-left': 'Iso Left', 'iso-right': 'Iso Right',
  'dramatic-low': 'Low Angle', 'floating-quarter': 'Float ¾',
}

const LAYOUTS: { id: LayoutPattern; label: string; glyph: string }[] = [
  { id: 'line', label: 'Line', glyph: '— — —' },
  { id: 'fan', label: 'Fan', glyph: '\\ | /' },
  { id: 'arc', label: 'Arc', glyph: '⌒' },
  { id: 'staircase', label: 'Steps', glyph: '▁▃▅' },
  { id: 'grid', label: 'Grid', glyph: '▦' },
  { id: 'rainbow', label: 'Orbit', glyph: '◜ ◝' },
  { id: 'mirror', label: 'Mirror', glyph: '◁ ▷' },
  { id: 'ring', label: 'Ring', glyph: '○' },
]
const RAINBOW_COLORS: DeviceColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']

const ET_ICONS: Record<string, React.ReactNode> = {
  device: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="3" /></svg>,
  text:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg>,
  shape:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="4" /></svg>,
}

function Sep() { return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 10px' }} /> }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '9px 12px 5px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{children}</div>
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', transition: 'all 0.1s' }}
      onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent-glow)'; (e.currentTarget).style.color = 'var(--accent)'; (e.currentTarget).style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { (e.currentTarget).style.background = 'var(--surface)'; (e.currentTarget).style.color = 'var(--text-muted)'; (e.currentTarget).style.borderColor = 'var(--border)' }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, marginBottom: 1 }}>+</span>
      {label}
    </button>
  )
}

function IconBtn({ title, onClick, disabled, children }: { title: string; onClick?: (e: React.MouseEvent) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 3, border: 'none', background: 'transparent', color: 'var(--text-dim)', cursor: disabled ? 'default' : 'pointer', padding: 0, opacity: disabled ? 0.3 : 1 }}
      onMouseEnter={e => { if (!disabled) { (e.currentTarget).style.color = 'var(--text)'; (e.currentTarget).style.background = 'var(--surface-2)' } }}
      onMouseLeave={e => { (e.currentTarget).style.color = 'var(--text-dim)'; (e.currentTarget).style.background = 'transparent' }}
    >{children}</button>
  )
}

function ObjectRow({ obj, selected, index, total, onSelect, onRename, onToggleVisible, onToggleLocked, onRemove, onMoveUp, onMoveDown }: {
  obj: SceneObject; selected: boolean; index: number; total: number
  onSelect: () => void; onRename: (n: string) => void; onToggleVisible: () => void; onToggleLocked: () => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(obj.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = () => { setEditing(false); const t = draft.trim(); if (t && t !== obj.name) onRename(t); else setDraft(obj.name) }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(obj.name) } }

  const et = obj.elementType ?? 'device'

  return (
    <div
      onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 10px', borderRadius: 6, margin: '0 6px', background: selected ? 'var(--accent-glow)' : 'transparent', border: selected ? '1px solid rgba(59,126,248,0.3)' : '1px solid transparent', cursor: 'pointer', opacity: obj.visible ? 1 : 0.4 }}
      onMouseEnter={e => { if (!selected) (e.currentTarget).style.background = 'var(--surface)' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget).style.background = 'transparent' }}
    >
      <span style={{ color: selected ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0, display: 'flex' }}>{ET_ICONS[et]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--text)', fontSize: 11, padding: '2px 4px', fontFamily: 'inherit', outline: 'none' }} autoFocus />
        ) : (
          <span onDoubleClick={e => { e.stopPropagation(); setDraft(obj.name); setEditing(true); setTimeout(() => inputRef.current?.select(), 10) }} style={{ fontSize: 11, color: selected ? 'var(--text)' : 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {obj.name}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <IconBtn title="Move up" onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={index === 0}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg></IconBtn>
        <IconBtn title="Move down" onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg></IconBtn>
        <IconBtn title={obj.visible ? 'Hide' : 'Show'} onClick={e => { e.stopPropagation(); onToggleVisible() }}>
          {obj.visible
            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
          }
        </IconBtn>
        <IconBtn title={obj.locked ? 'Unlock' : 'Lock'} onClick={e => { e.stopPropagation(); onToggleLocked() }}>
          {obj.locked
            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" /></svg>
          }
        </IconBtn>
        <IconBtn title="Delete" onClick={e => { e.stopPropagation(); onRemove() }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
        </IconBtn>
      </div>
    </div>
  )
}

export default function LeftSidebar() {
  const { state, selectedObject, addDevice, addText, addShape, removeObject, selectObject, updateObject, updateDevice, updateTransform, reorderObjects, applyLayout, applyLinkedLayout } = useEditor()
  const mediaRef = useRef<HTMLInputElement>(null)
  const [layout, setLayout] = useState<LayoutPattern>('fan')
  const [layoutSpacing, setLayoutSpacing] = useState(210)
  const [layoutDepth, setLayoutDepth] = useState(28)
  const [layoutCurve, setLayoutCurve] = useState(24)
  const [rainbowColors, setRainbowColors] = useState(true)
  const [linkedCopies, setLinkedCopies] = useState(false)
  const [copyCount, setCopyCount] = useState(8)
  const { objects, selectedId } = state

  const validObjects = objects.filter(o => o?.id && o?.transform && typeof o.transform.rotX === 'number')

  const handleMediaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    const isVideo = file.type.startsWith('video/')
    const isGif = file.type === 'image/gif'

    if (isVideo) {
      // Use object URL for video to avoid huge base64 strings
      const url = URL.createObjectURL(file)
      updateObject(selectedId, { screenshot: url, screenshotType: 'video' })
    } else if (isGif) {
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result && selectedId) {
          updateObject(selectedId, { screenshot: ev.target.result as string, screenshotType: 'gif' })
        }
      }
      reader.readAsDataURL(file)
    } else {
      const sourceUrl = URL.createObjectURL(file)
      try {
        const image = new Image()
        image.src = sourceUrl
        await image.decode()
        const maxDimension = 4096
        const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
        const context = canvas.getContext('2d')!
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const optimized = canvas.toDataURL('image/webp', 0.92)
        updateObject(selectedId, { screenshot: optimized, screenshotType: 'image' })
      } finally {
        URL.revokeObjectURL(sourceUrl)
      }
    }
    e.target.value = ''
  }

  const applyAngle = (preset: AnglePreset) => {
    if (!selectedId) return
    updateTransform(selectedId, ANGLE_PRESETS[preset])
  }

  const sel = selectedObject
  const selIsDevice = sel?.elementType === 'device' || sel?.elementType == null
  const layoutTargets = validObjects.filter(o => o.visible && !o.locked && (o.elementType === 'device' || o.elementType == null))

  const applyCurrentLayout = () => {
    if (linkedCopies) applyLinkedLayout(layout, layoutSpacing, layoutDepth, layoutCurve, copyCount)
    else applyLayout(layout, layoutSpacing, layoutDepth, layoutCurve)
    if (rainbowColors && !linkedCopies) layoutTargets.forEach((o, index) => updateDevice(o.id, { color: RAINBOW_COLORS[index % RAINBOW_COLORS.length] }))
  }

  return (
    <div style={{ width: 220, flexShrink: 0, background: 'var(--panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* Scene object list */}
      <SectionLabel>Scene ({validObjects.length})</SectionLabel>
      <div style={{ paddingBottom: 4 }}>
        {validObjects.length === 0 ? (
          <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>No objects</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {validObjects.map((obj, idx) => (
              <ObjectRow
                key={obj.id}
                obj={obj}
                selected={obj.id === selectedId}
                index={idx}
                total={validObjects.length}
                onSelect={() => selectObject(obj.id)}
                onRename={name => updateObject(obj.id, { name })}
                onToggleVisible={() => updateObject(obj.id, { visible: !obj.visible })}
                onToggleLocked={() => updateObject(obj.id, { locked: !obj.locked })}
                onRemove={() => removeObject(obj.id)}
                onMoveUp={() => reorderObjects(idx, idx - 1)}
                onMoveDown={() => reorderObjects(idx, idx + 1)}
              />
            ))}
          </div>
        )}
      </div>

      <Sep />

      {/* Non-destructive layout patterns */}
      <SectionLabel>Pattern Layout</SectionLabel>
      <div style={{ padding: '0 10px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {LAYOUTS.map(item => (
            <button key={item.id} onClick={() => setLayout(item.id)} style={{ padding: '7px 3px 6px', borderRadius: 6, border: `1px solid ${layout === item.id ? 'var(--accent)' : 'var(--border)'}`, background: layout === item.id ? 'var(--accent-glow)' : 'var(--surface)', color: layout === item.id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
              <span style={{ display: 'block', height: 13, fontSize: 11 }}>{item.glyph}</span>{item.label}
            </button>
          ))}
        </div>
        {[
          ['Spacing', layoutSpacing, setLayoutSpacing, 40, 1200],
          ['Depth', layoutDepth, setLayoutDepth, 0, 600],
          ['Curve', layoutCurve, setLayoutCurve, 0, 180],
        ].map(([label, value, setter, min, max]) => (
          <label key={label as string} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 30px', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>{label as string}</span>
            <input type="range" min={min as number} max={max as number} value={value as number} onChange={e => (setter as (n: number) => void)(Number(e.target.value))} style={{ width: '100%' }} />
            <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{value as number}</span>
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={rainbowColors} onChange={e => setRainbowColors(e.target.checked)} /> Rainbow device colors
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={linkedCopies} onChange={e => setLinkedCopies(e.target.checked)} /> Linked copies from selected
        </label>
        {linkedCopies && <label style={{ display: 'grid', gridTemplateColumns: '48px 1fr 30px', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          <span>Copies</span><input type="range" min={2} max={24} value={copyCount} onChange={e => setCopyCount(Number(e.target.value))} style={{ width: '100%' }} /><span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{copyCount}</span>
        </label>}
        <button onClick={applyCurrentLayout} disabled={linkedCopies ? !selIsDevice : layoutTargets.length < 2} style={{ width: '100%', marginTop: 9, padding: '7px 8px', borderRadius: 6, border: 'none', background: (linkedCopies ? selIsDevice : layoutTargets.length >= 2) ? 'var(--accent)' : 'var(--surface-2)', color: (linkedCopies ? selIsDevice : layoutTargets.length >= 2) ? '#fff' : 'var(--text-dim)', cursor: (linkedCopies ? selIsDevice : layoutTargets.length >= 2) ? 'pointer' : 'default', fontSize: 10, fontWeight: 600 }}>
          {linkedCopies ? `Create ${copyCount} linked devices` : `Arrange ${layoutTargets.length} devices`}
        </button>
        <div style={{ marginTop: 6, fontSize: 9, lineHeight: 1.35, color: 'var(--text-dim)' }}>{linkedCopies ? 'Changing any linked device updates the model, material, and screen across the group.' : 'Uses visible, unlocked devices. Screens and materials stay intact.'}</div>
      </div>

      <Sep />

      {/* Add Devices */}
      <SectionLabel>Devices</SectionLabel>
      <div style={{ padding: '0 10px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {DEVICE_TYPES.map(d => <AddBtn key={d.type} label={d.label} onClick={() => addDevice(d.type)} />)}
      </div>

      <Sep />

      {/* Add Elements */}
      <SectionLabel>Elements</SectionLabel>
      <div style={{ padding: '0 10px 4px' }}>
        <AddBtn label="Text Label" onClick={addText} />
      </div>
      <div style={{ padding: '4px 10px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {SHAPE_TYPES.map(s => <AddBtn key={s.type} label={s.label} onClick={() => addShape(s.type)} />)}
      </div>

      <Sep />

      {/* Angle presets (device objects only) */}
      <SectionLabel>Angle Presets</SectionLabel>
      <div style={{ padding: '0 10px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {(Object.keys(ANGLE_PRESETS) as AnglePreset[]).map(preset => (
          <button
            key={preset}
            onClick={() => applyAngle(preset)}
            disabled={!selectedId}
            style={{ padding: '6px 5px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: selectedId ? 'var(--text-muted)' : 'var(--text-dim)', cursor: selectedId ? 'pointer' : 'default', fontSize: 10, fontFamily: 'var(--font-mono)', transition: 'all 0.1s', textAlign: 'center' }}
            onMouseEnter={e => { if (selectedId) { (e.currentTarget).style.background = 'var(--surface-2)'; (e.currentTarget).style.color = 'var(--text)' } }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'var(--surface)'; (e.currentTarget).style.color = selectedId ? 'var(--text-muted)' : 'var(--text-dim)' }}
          >
            {ANGLE_LABELS[preset]}
          </button>
        ))}
      </div>
      {!selectedId && <div style={{ padding: '0 14px 8px', fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>Select object first</div>}

      <Sep />

      {/* Screen content upload (for device objects) */}
      <SectionLabel>Screen Content</SectionLabel>
      <div style={{ padding: '0 10px 10px' }}>
        <input ref={mediaRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" style={{ display: 'none' }} onChange={handleMediaUpload} />
        <div
          onClick={() => selIsDevice && selectedId ? mediaRef.current?.click() : undefined}
          style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: selIsDevice && selectedId ? 'pointer' : 'default', background: 'var(--surface)', transition: 'all 0.12s', opacity: selIsDevice && selectedId ? 1 : 0.45 }}
          onMouseEnter={e => { if (selIsDevice && selectedId) { (e.currentTarget).style.borderColor = 'var(--accent)'; (e.currentTarget).style.background = 'var(--accent-glow)' } }}
          onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.background = 'var(--surface)' }}
        >
          {sel?.screenshot && selIsDevice ? (
            <>
              <div style={{ width: '100%', height: 60, borderRadius: 5, overflow: 'hidden', background: '#000' }}>
                {sel.screenshotType === 'video'
                  ? <video src={sel.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  : <img src={sel.screenshot} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                }
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)', background: 'var(--accent-glow)', padding: '2px 6px', borderRadius: 3 }}>
                  {sel.screenshotType ?? 'image'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click to replace</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ color: 'var(--text-dim)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {selIsDevice && selectedId ? 'Upload content' : 'Select a device first'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  PNG · JPG · GIF · MP4 · WebM
                </div>
              </div>
            </>
          )}
        </div>
        {sel?.screenshot && selIsDevice && selectedId && (
          <button
            onClick={() => updateObject(selectedId, { screenshot: null, screenshotType: null })}
            style={{ marginTop: 5, width: '100%', padding: '5px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', transition: 'all 0.1s' }}
            onMouseEnter={e => { (e.currentTarget).style.color = 'var(--danger)'; (e.currentTarget).style.borderColor = 'var(--danger)' }}
            onMouseLeave={e => { (e.currentTarget).style.color = 'var(--text-muted)'; (e.currentTarget).style.borderColor = 'var(--border)' }}
          >
            Remove content
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Shortcuts */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.9 }}>
          {[['V', 'Select'], ['W', 'Move'], ['E', 'Rotate'], ['Del', 'Remove'], ['⌘D', 'Duplicate'], ['Esc', 'Deselect']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--accent)', opacity: 0.7 }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
