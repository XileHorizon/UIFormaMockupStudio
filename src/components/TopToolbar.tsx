import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { useEditor, encodeProjectToUrl, decodeProjectFromUrl } from '../store'
import type { AppState } from '../types'

const tools = [
  { id: 'select' as const, key: 'V', label: 'Select (V)' },
  { id: 'move'   as const, key: 'W', label: 'Move (W)'   },
  { id: 'rotate' as const, key: 'E', label: 'Rotate (E)' },
  { id: 'scale'  as const, key: 'R', label: 'Scale (R)'  },
]

function Btn({ title, onClick, active, children, danger }: { title: string; onClick?: () => void; children: React.ReactNode; active?: boolean; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 5,
        border: active ? '1px solid var(--accent)' : '1px solid transparent',
        background: active ? 'var(--accent-glow)' : 'transparent',
        color: active ? 'var(--accent)' : danger ? 'var(--danger)' : 'var(--text-muted)',
        cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)',
        transition: 'all 0.1s', flexShrink: 0, gap: 4,
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget).style.background = 'var(--surface)'; (e.currentTarget).style.color = danger ? 'var(--danger)' : 'var(--text)' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = danger ? 'var(--danger)' : 'var(--text-muted)' } }}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 3px', flexShrink: 0 }} />
}

export default function TopToolbar({ onExport }: { onExport: () => void }) {
  const { state, selectedObject, setTool, duplicateObject, removeObject, alignObjects, distributeObjects, toggleTemplatesModal, importProject } = useEditor()
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
    a.download = 'mockframe-project.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 2, background: 'var(--panel)', borderBottom: '1px solid var(--border)', flexShrink: 0, zIndex: 100 }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 10, flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="5" y="2" width="14" height="20" rx="3" /><rect x="9" y="5" width="6" height="11" rx="1" />
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>MockFrame</span>
      </div>

      <Sep />

      {/* Tool selector */}
      {tools.map(t => (
        <Btn key={t.id} title={t.label} onClick={() => setTool(t.id)} active={activeTool === t.id}>
          <span style={{ fontSize: 10, fontWeight: 700 }}>{t.key}</span>
        </Btn>
      ))}

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
        <span style={{ fontSize: 10 }}>Templates</span>
      </Btn>

      <Sep />

      {/* Project import / export */}
      <input ref={fileImportRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleProjectImport} />
      <Btn title="Import project (.json)" onClick={() => fileImportRef.current?.click()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: 10 }}>Import</span>
      </Btn>
      <Btn title="Save project as JSON" onClick={handleProjectExport}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span style={{ fontSize: 10 }}>Save</span>
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
        <span style={{ fontSize: 10 }}>{copyLabel}</span>
      </Btn>

      {/* Export PNG */}
      <button
        onClick={onExport}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'background 0.1s', flexShrink: 0 }}
        onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent-hover)' }}
        onMouseLeave={e => { (e.currentTarget).style.background = 'var(--accent)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>
    </div>
  )
}
