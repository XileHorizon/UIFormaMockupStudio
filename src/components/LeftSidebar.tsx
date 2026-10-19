import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { useEditor } from '../store'
import type { DeviceType, AnglePreset, SceneObject, ShapeType, LayoutPattern, DeviceColor, PatternPlane, PatternAxis, RotationFollowAxis } from '../types'
import { ANGLE_PRESETS } from '../types'
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react'
import AutoLayoutPanel from './AutoLayoutPanel'
import { Button, ButtonBlock } from '../kit'
import { Hint, Section } from './studio-ui'

const DEVICE_TYPES: { type: DeviceType; label: string }[] = [
  { type: 'macbook-air',    label: 'MacBook Air'    },
  { type: 'iphone-17-pro',   label: 'iPhone 17 Pro'  },
  { type: 'ipad-pro',        label: 'iPad Pro'        },
  { type: 'laptop-3d',       label: 'Laptop 3D'       },
  { type: 'imac-2021',       label: 'iMac 2021'       },
  { type: 'nintendo-switch',  label: 'Nintendo Switch' },
  { type: 'game-boy',         label: 'Game Boy'        },
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

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button appearance="surface" size="compact" className="studio-add" leadingIcon={<IconPlus />} onClick={onClick}>{label}</Button>
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
  onSelect: (additive: boolean) => void; onRename: (n: string) => void; onToggleVisible: () => void; onToggleLocked: () => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(obj.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = () => { setEditing(false); const t = draft.trim(); if (t && t !== obj.name) onRename(t); else setDraft(obj.name) }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(obj.name) } }

  const et = obj.elementType ?? 'device'

  return (
    <div
      onClick={event => onSelect(event.shiftKey)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 10px', borderRadius: 'var(--uf-radius-sm)', margin: '0 6px', background: selected ? 'var(--accent-glow)' : 'transparent', border: selected ? '1px solid var(--accent-border)' : '1px solid transparent', cursor: 'pointer', opacity: obj.visible ? 1 : 0.4 }}
      onMouseEnter={e => { if (!selected) (e.currentTarget).style.background = 'var(--surface)' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget).style.background = 'transparent' }}
    >
      <span style={{ color: selected ? 'var(--accent-text)' : 'var(--text-dim)', flexShrink: 0, display: 'flex' }}>{ET_ICONS[et]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: 4, color: 'var(--text)', fontSize: 11, padding: '2px 4px', fontFamily: 'inherit', outline: 'none' }} autoFocus />
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
  const { state, selectedObject, addDevice, addText, addShape, removeObject, selectObject, updateObject, updateDevice, updateTransform, reorderObjects, applyLayout, generatePattern } = useEditor()
  const mediaRef = useRef<HTMLInputElement>(null)
  const [layout, setLayout] = useState<LayoutPattern>('fan')
  const [layoutSpacing, setLayoutSpacing] = useState(210)
  const [layoutDepth, setLayoutDepth] = useState(28)
  const [layoutCurve, setLayoutCurve] = useState(24)
  const [rainbowColors, setRainbowColors] = useState(true)
  const [copyMode, setCopyMode] = useState<'arrange' | 'clone'>('arrange')
  const [liveLink, setLiveLink] = useState(false)
  const [copyCount, setCopyCount] = useState(8)
  const [patternPlane, setPatternPlane] = useState<PatternPlane>('xy')
  const [mirrorAxis, setMirrorAxis] = useState<PatternAxis>('x')
  const [rotationAxis, setRotationAxis] = useState<RotationFollowAxis>('y')
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
    if (copyMode === 'arrange') applyLayout(layout, layoutSpacing, layoutDepth, layoutCurve, patternPlane, mirrorAxis, rotationAxis)
    else generatePattern(layout, layoutSpacing, layoutDepth, layoutCurve, copyCount, liveLink ? 'linked' : 'clone', patternPlane, mirrorAxis, rotationAxis)
    if (rainbowColors && copyMode === 'arrange') layoutTargets.forEach((o, index) => updateDevice(o.id, { color: RAINBOW_COLORS[index % RAINBOW_COLORS.length] }))
  }

  // A live-linked group is parametric: every layout control immediately
  // regenerates its transforms and member count from the selected source.
  useEffect(() => {
    if (!liveLink || copyMode !== 'clone' || !selIsDevice || !selectedId) return
    generatePattern(layout, layoutSpacing, layoutDepth, layoutCurve, copyCount, 'linked', patternPlane, mirrorAxis, rotationAxis)
    // Selection is intentionally not a dependency. Clicking a different group
    // member must not regenerate the arrangement; the next control change uses
    // whichever member is currently selected as the source.
  }, [liveLink, copyMode, layout, layoutSpacing, layoutDepth, layoutCurve, copyCount, patternPlane, mirrorAxis, rotationAxis, generatePattern])

  return (
    <aside className="studio-panel" style={{ width: 248, flexShrink: 0, borderRight: '1px solid var(--border)' }}>
      <Section title={`Scene (${validObjects.length})`} spacing="compact">
        {validObjects.length === 0 ? (
          <Hint>No objects yet. Add a device below.</Hint>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -6px' }}>
            {validObjects.map((obj, idx) => (
              <ObjectRow
                key={obj.id}
                obj={obj}
                selected={(state.selectedIds ?? [selectedId]).includes(obj.id)}
                index={idx}
                total={validObjects.length}
                onSelect={additive => selectObject(obj.id, additive)}
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
      </Section>

      <Section title="Devices" spacing="compact">
        <div className="studio-add-list">
          {DEVICE_TYPES.map(d => <AddBtn key={d.type} label={d.label} onClick={() => addDevice(d.type)} />)}
        </div>
      </Section>

      <Section title="Elements" spacing="compact">
        <div className="studio-add-grid">
          <AddBtn label="Text" onClick={addText} />
          {SHAPE_TYPES.map(s => <AddBtn key={s.type} label={s.label} onClick={() => addShape(s.type)} />)}
        </div>
      </Section>

      <Section title="Screen Content" spacing="compact">
        <input ref={mediaRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" style={{ display: 'none' }} onChange={handleMediaUpload} />
        <button type="button" className="studio-drop" disabled={!(selIsDevice && selectedId)} onClick={() => mediaRef.current?.click()}>
          {sel?.screenshot && selIsDevice ? (
            <>
              <span className="studio-drop__preview">
                {sel.screenshotType === 'video'
                  ? <video src={sel.screenshot} muted />
                  : <img src={sel.screenshot} alt="" />}
              </span>
              <span className="studio-drop__title">Replace {sel.screenshotType ?? 'image'}</span>
            </>
          ) : (
            <>
              <IconUpload />
              <span className="studio-drop__title">{selIsDevice && selectedId ? 'Upload screen' : 'Select a device first'}</span>
              <span className="studio-drop__meta">PNG · JPG · GIF · MP4 · WebM</span>
            </>
          )}
        </button>
        {sel?.screenshot && selIsDevice && selectedId && (
          <Button appearance="surface" size="compact" leadingIcon={<IconTrash />} style={{ width: '100%' }} onClick={() => updateObject(selectedId, { screenshot: null, screenshotType: null })}>Remove content</Button>
        )}
      </Section>

      <Section title="Device Angle" spacing="compact">
        <ButtonBlock
          label="Device angle"
          onValueChange={preset => applyAngle(preset)}
          items={(Object.keys(ANGLE_PRESETS) as AnglePreset[]).map(preset => ({ value: preset, label: ANGLE_LABELS[preset], disabled: !selectedId }))}
        />
        {!selectedId && <Hint>Select an object first.</Hint>}
      </Section>

      <Section title="Auto Layout" spacing="compact">
        <AutoLayoutPanel />
      </Section>

      {/* Shortcuts */}
      <div style={{ marginTop: 'auto', padding: '12px 14px 0', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.9 }}>
        {[['V W E R', 'Select · Move · Rotate · Scale'], ['0–7', 'Camera views'], ['⌘D', 'Duplicate'], ['Del', 'Remove'], ['Esc', 'Deselect']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: 'var(--accent-hover)' }}>{k}</span>
            <span style={{ textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
