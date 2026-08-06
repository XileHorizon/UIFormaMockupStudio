import { useState, useRef } from 'react'
import { toPng, toJpeg, toBlob } from 'html-to-image'
import { useEditor } from '../store'

interface Props {
  canvasRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}

type Format = 'png' | 'jpeg' | 'webp'
type Scale = 1 | 2 | 3 | 4

export default function ExportModal({ canvasRef, onClose }: Props) {
  const { state, selectObject } = useEditor()
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState<Scale>(2)
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const withoutSelection = async <T,>(capture: () => Promise<T>) => {
    const previousSelection = state.selectedId
    selectObject(null)
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    try {
      return await capture()
    } finally {
      selectObject(previousSelection)
    }
  }

  const handleExport = async () => {
    if (!canvasRef.current) return
    setExporting(true)
    try {
      const options = {
        pixelRatio: scale,
        skipFonts: false,
        backgroundColor: format === 'jpeg' ? '#ffffff' : undefined,
      }

      let dataUrl: string
      if (format === 'jpeg') {
        dataUrl = await withoutSelection(() => toJpeg(canvasRef.current!, { ...options, quality: 0.95, backgroundColor: '#ffffff' }))
      } else {
        dataUrl = await withoutSelection(() => toPng(canvasRef.current!, options))
      }

      const link = document.createElement('a')
      link.download = `mockframe-export.${format === 'jpeg' ? 'jpg' : format}`
      link.href = dataUrl
      link.click()
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return
    setExporting(true)
    try {
      const blob = await withoutSelection(() => toBlob(canvasRef.current!, { pixelRatio: scale }))
      if (blob && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        setDone(true)
        setTimeout(() => setDone(false), 2000)
      }
    } catch (err) {
      console.error('Clipboard failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const formats: { id: Format; label: string }[] = [
    { id: 'png', label: 'PNG' },
    { id: 'jpeg', label: 'JPG' },
    { id: 'webp', label: 'WebP' },
  ]

  const scales: { id: Scale; label: string }[] = [
    { id: 1, label: '1×' },
    { id: 2, label: '2×' },
    { id: 3, label: '3×' },
    { id: 4, label: '4×' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: 360,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Export</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Format */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              Format
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {formats.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 6,
                    border: format === f.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: format === f.id ? 'var(--accent-glow)' : 'var(--surface)',
                    color: format === f.id ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.1s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {format === 'png' && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
                Supports transparent backgrounds.
              </p>
            )}
          </div>

          {/* Scale */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              Scale
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {scales.map(s => (
                <button
                  key={s.id}
                  onClick={() => setScale(s.id)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 6,
                    border: scale === s.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: scale === s.id ? 'var(--accent-glow)' : 'var(--surface)',
                    color: scale === s.id ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.1s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Watermark', value: 'None' },
              { label: 'Transparent BG', value: format === 'png' ? 'Yes' : 'No' },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, background: 'var(--surface)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopyToClipboard}
            disabled={exporting}
            style={{
              flex: 0,
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              cursor: exporting ? 'wait' : 'pointer',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: 'all 0.1s',
            }}
          >
            Copy to Clipboard
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: done ? 'var(--success)' : 'var(--accent)',
              color: '#fff',
              cursor: exporting ? 'wait' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {exporting ? (
              <>Exporting...</>
            ) : done ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Downloaded
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
