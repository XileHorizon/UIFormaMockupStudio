import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { useEditor, encodeProjectToUrl, decodeProjectFromUrl } from '../store'
import type { AppState } from '../types'
import { IconDownload } from '@tabler/icons-react'
import { Button, SegmentedControl } from '../kit'

const tools = [
  { id: 'select' as const, key: 'V', label: 'Select (V)' },
  { id: 'move'   as const, key: 'W', label: 'Move (W)'   },
  { id: 'rotate' as const, key: 'E', label: 'Rotate (E)' },
  { id: 'scale'  as const, key: 'R', label: 'Scale (R)'  },
]

function Btn({ title, onClick, active, children, danger }: { title: string; onClick?: () => void; children: React.ReactNode; active?: boolean; danger?: boolean }) {
  // Kit surface button; an svg child becomes the leading icon and any text becomes the label.
  const parts = Array.isArray(children) ? children : [children]
  const icon = parts.find(part => (part as { type?: unknown })?.type === 'svg')
  const label = parts.filter(part => part !== icon)
  return (
    <Button
      appearance="surface"
      size="compact"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      onClick={onClick}
      leadingIcon={icon}
      className={`studio-toolbar-button${danger ? ' is-danger' : ''}`}
    >
      {label.length ? label : null}
    </Button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px', flexShrink: 0 }} />
}

export default function TopToolbar({ onExport }: { onExport: () => void }) {
  const { state, selectedObject, canUndo, canRedo, undo, redo, setTool, duplicateObject, removeObject, alignObjects, distributeObjects, toggleTemplatesModal, importProject } = useEditor()
  const fileImportRef = useRef<HTMLInputElement>(null)
  const screenshotRef = useRef<HTMLInputElement>(null)
  const { activeTool, objects, selectedId } = state
  const sel = selectedObject
  const [copyLabel, setCopyLabel] = useState<'Share' | 'Copied!'>('Share')

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.length > 1) {
      const data = decodeProjectFromUrl(hash)
      if (data) importProject(data)
    }
  }, [])

  const handleScreenshotUpload = (e: ChangeEvent<HTMLInputElement>) => {
    // Handled in LeftSidebar — this is a quick-access fallback via toolbar
    e.target.value = ''
  }

  const handleProjectImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AppState
        if (data.objects && Array.isArray(data.objects)) {
          importProject(data)
        }
      } catch {
        alert('Could not read project file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleShare = () => {
    const encoded = encodeProjectToUrl(state)
    window.location.hash = encoded
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Share'), 2000)
  }

  const handleProjectExport = () => {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uiforma-mockup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 12px 0 16px', gap: 4, background: 'var(--header)', borderBottom: '1px solid var(--bg)', flexShrink: 0, zIndex: 100 }}>

      {/* Logo */}
      <a href="https://uiforma.com" title="UIForma" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 12, flexShrink: 0, textDecoration: 'none' }}>
        <img src="/uiforma-logo.svg" alt="UIForma" style={{ height: 22, width: 'auto', display: 'block' }} />
        <span style={{ padding: '3px 7px', borderRadius: 'var(--uf-radius-sm)', background: 'var(--accent-glow)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 11, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Mockup Studio</span>
      </a>

      <Sep />

      {/* Tool selector */}
      <SegmentedControl
        label="Tool"
        value={activeTool}
        onValueChange={setTool}
        items={tools.map(t => ({ value: t.id, label: <span title={t.label}>{t.key}</span> }))}
      />

      <Sep />

      <Btn title="Undo (Cmd+Z)" onClick={canUndo ? undo : undefined}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h9a7 7 0 017 7v4"/></svg>
      </Btn>
      <Btn title="Redo (Cmd+Shift+Z)" onClick={canRedo ? redo : undefined}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l5-5-5-5"/><path d="M20 9h-9a7 7 0 00-7 7v4"/></svg>
      </Btn>

      <Sep />

      {/* Object actions — active when something is selected */}
      <Btn title="Duplicate selected (Cmd+D)" onClick={() => sel && duplicateObject(sel.id)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="8" y="8" width="13" height="13" rx="2" /><path d="M4 16H3a2 2 0 01-2-2V3a2 2 0 012-2h11a2 2 0 012 2v1" />
        </svg>
      </Btn>
      <Btn title="Delete selected (Del)" onClick={() => sel && removeObject(sel.id)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
      </Btn>

      <Sep />

      {/* Align / distribute — visible when 2+ objects */}
      {objects.length >= 2 && (
        <>
          <Btn title="Align horizontally (same Y)" onClick={() => alignObjects('horizontal')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><rect x="6" y="8" width="5" height="8" rx="1" /><rect x="13" y="8" width="5" height="8" rx="1" />
            </svg>
          </Btn>
          <Btn title="Align vertically (same X)" onClick={() => alignObjects('vertical')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="3" x2="12" y2="21" /><rect x="8" y="6" width="8" height="5" rx="1" /><rect x="8" y="13" width="8" height="5" rx="1" />
            </svg>
          </Btn>
          {objects.length >= 3 && (
            <>
              <Btn title="Distribute horizontally (even spacing)" onClick={() => distributeObjects('horizontal')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="4" x2="3" y2="20" /><line x1="21" y1="4" x2="21" y2="20" /><rect x="8" y="8" width="8" height="8" rx="1" />
                </svg>
              </Btn>
              <Btn title="Distribute vertically (even spacing)" onClick={() => distributeObjects('vertical')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="3" x2="20" y2="3" /><line x1="4" y1="21" x2="20" y2="21" /><rect x="8" y="8" width="8" height="8" rx="1" />
                </svg>
              </Btn>
            </>
          )}
          <Sep />
        </>
      )}

      {/* Templates */}
      <Btn title="Templates" onClick={toggleTemplatesModal}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
        Templates
      </Btn>

      <Sep />

      {/* Project import / export */}
      <input ref={fileImportRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleProjectImport} />
      <Btn title="Import project (.json)" onClick={() => fileImportRef.current?.click()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import
      </Btn>
      <Btn title="Save project as JSON" onClick={handleProjectExport}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Save
      </Btn>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Object count indicator */}
      {objects.length > 0 && (
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {objects.length} object{objects.length !== 1 ? 's' : ''}
          {sel ? ` · ${sel.name}` : ''}
        </span>
      )}

      {/* Share */}
      <Btn title="Copy shareable link to clipboard" onClick={handleShare} active={copyLabel === 'Copied!'}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copyLabel}
      </Btn>

      {/* Export PNG */}
      <Button appearance="primary" size="compact" leadingIcon={<IconDownload />} onClick={onExport} style={{ marginLeft: 6 }}>Export</Button>
    </div>
  )
}
