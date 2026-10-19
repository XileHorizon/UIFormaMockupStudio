import { IconArrowBackUp, IconArrowForwardUp, IconFlipVertical, IconRotate360, IconTrash } from '@tabler/icons-react'
import { useEditor } from '../store'
import type { LayoutModifier, MirrorLayoutSettings, PatternAxis, RadialLayoutSettings } from '../types'
import { Button, FieldRow, Select, SidebarSlider } from '../kit'
import { Hint } from './studio-ui'

const AXES: PatternAxis[] = ['x', 'y', 'z']

function ModifierCard({ title, sources, children }: { title: string; sources: number; children: React.ReactNode }) {
  return (
    <div className="studio-modifier">
      <div className="studio-modifier__header"><strong>{title}</strong><span>{sources} source{sources === 1 ? '' : 's'}</span></div>
      {children}
    </div>
  )
}

function ModifierEditor({ modifier }: { modifier: LayoutModifier }) {
  const { updateLayoutModifier, removeLayoutModifier } = useEditor()
  const setSettings = (settings: LayoutModifier['settings']) => updateLayoutModifier(modifier.id, { settings })
  const remove = <Button appearance="surface" size="compact" leadingIcon={<IconTrash />} onClick={() => removeLayoutModifier(modifier.id)}>Remove</Button>
  if (modifier.type === 'radial') {
    const settings = modifier.settings as RadialLayoutSettings
    const slider = (label: string, key: 'count' | 'angle' | 'startAngle' | 'radiusOffset' | 'rotationOffset' | 'tiltAmount', min: number, max: number) => (
      <SidebarSlider label={label} value={settings[key] ?? 0} min={min} max={max} step={1} formatValue={v => v.toFixed(0)} onValueChange={value => setSettings({ ...settings, [key]: value })} />
    )
    return (
      <ModifierCard title="Radial" sources={modifier.sourceIds.length}>
        <FieldRow>
          <Select label="Axis" value={settings.axis} onChange={event => setSettings({ ...settings, axis: event.currentTarget.value as PatternAxis })} options={AXES.map(axis => ({ value: axis, label: axis.toUpperCase() }))} />
          <Select label="Orientation" value={settings.orientation} onChange={event => setSettings({ ...settings, orientation: event.currentTarget.value as 'follow' | 'preserve' })} options={[{ value: 'follow', label: 'Follow path' }, { value: 'preserve', label: 'Keep original' }]} />
        </FieldRow>
        {slider('Count', 'count', 1, 128)}
        {slider('Angle', 'angle', -360, 360)}
        {slider('Start', 'startAngle', -1440, 1440)}
        {slider('Radius +', 'radiusOffset', -500, 1000)}
        {slider('Rotation', 'rotationOffset', -360, 360)}
        {slider('3D tilt', 'tiltAmount', -180, 180)}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          <Button appearance="surface" size="compact" leadingIcon={settings.direction === 1 ? <IconArrowForwardUp /> : <IconArrowBackUp />} onClick={() => setSettings({ ...settings, direction: settings.direction === 1 ? -1 : 1 })}>
            {settings.direction === 1 ? 'Clockwise' : 'Counter'}
          </Button>
          {remove}
        </div>
      </ModifierCard>
    )
  }
  const settings = modifier.settings as MirrorLayoutSettings
  return (
    <ModifierCard title="Mirror" sources={modifier.sourceIds.length}>
      <div className="uf-segmented-control" role="group" aria-label="Mirror axes">
        {AXES.map(axis => {
          const on = settings.axes.includes(axis)
          return (
            <button key={axis} type="button" aria-pressed={on} data-state={on ? 'checked' : 'unchecked'} style={{ flex: 1 }}
              onClick={() => setSettings({ ...settings, axes: on ? settings.axes.filter(value => value !== axis) : [...settings.axes, axis] })}>
              {axis.toUpperCase()}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{remove}</div>
    </ModifierCard>
  )
}

export default function AutoLayoutPanel() {
  const { state, addLayoutModifier } = useEditor()
  const selectedCount = state.selectedIds?.length ?? (state.selectedId ? 1 : 0)
  return (
    <>
      <Hint>{selectedCount ? `${selectedCount} selected · Shift-click to add sources` : 'Select one or more source objects'}</Hint>
      <div className="studio-add-grid">
        <Button appearance="surface" size="compact" leadingIcon={<IconRotate360 />} disabled={!selectedCount} onClick={() => addLayoutModifier('radial')}>Radial</Button>
        <Button appearance="surface" size="compact" leadingIcon={<IconFlipVertical />} disabled={!selectedCount} onClick={() => addLayoutModifier('mirror')}>Mirror</Button>
      </div>
      {(state.layouts ?? []).map(modifier => <ModifierEditor key={modifier.id} modifier={modifier} />)}
    </>
  )
}
