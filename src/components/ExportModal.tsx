import { useState, useRef } from 'react'
import { toPng, toJpeg, toBlob } from 'html-to-image'
import { useEditor } from '../store'

interface Props {
  canvasRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}

type Format = 'png' | 'jpeg' | 'webp'
export default function ExportModal({ canvasRef, onClose }: Props) {
  const { state, selectObject } = useEditor()
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState(2)
  const [gpuDpr, setGpuDpr] = useState(2)
  const [shadowLevel, setShadowLevel] = useState(2)
  const [quality, setQuality] = useState(95)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [rayTracing, setRayTracing] = useState(false)
  const [raySamples, setRaySamples] = useState(32)
  const [rayBounces, setRayBounces] = useState(6)
  const [renderProgress, setRenderProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const withoutSelection = async <T,>(capture: () => Promise<T>) => {
    const previousSelection = state.selectedId
    const previousClassName = canvasRef.current?.className ?? ''
    const previousBackground = canvasRef.current?.style.background ?? ''
    selectObject(null)
    window.dispatchEvent(new CustomEvent('mockframe-render-quality', { detail: { dpr: gpuDpr, shadowMapSize: 2 ** (shadowLevel + 9) } }))
    if (state.background.type === 'transparent' && canvasRef.current) {
      canvasRef.current.classList.remove('checkerboard')
      canvasRef.current.style.background = 'transparent'
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    if (rayTracing) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => finish(new Error('Ray tracing timed out. Try fewer samples or a lower GPU setting.')), 120_000)
        const onReady = () => finish()
        const onError = (event: Event) => finish(new Error((event as CustomEvent<{ message: string }>).detail?.message || 'Ray tracing failed for this scene.'))
        const onProgress = (event: Event) => {
          const { samples, target } = (event as CustomEvent<{ samples: number; target: number }>).detail
          setRenderProgress(`Ray tracing ${samples}/${target} samples`)
        }
        const finish = (error?: Error) => {
          window.clearTimeout(timeout)
          window.removeEventListener('mockframe-pathtrace-ready', onReady)
          window.removeEventListener('mockframe-pathtrace-error', onError)
          window.removeEventListener('mockframe-pathtrace-progress', onProgress)
          error ? reject(error) : resolve()
        }
        window.addEventListener('mockframe-pathtrace-ready', onReady)
        window.addEventListener('mockframe-pathtrace-error', onError)
        window.addEventListener('mockframe-pathtrace-progress', onProgress)
        window.dispatchEvent(new CustomEvent('mockframe-pathtrace', { detail: { enabled: true, samples: raySamples, bounces: rayBounces } }))
      })
    }
    try {
      return await capture()
    } finally {
      if (canvasRef.current) {
        canvasRef.current.className = previousClassName
        canvasRef.current.style.background = previousBackground
      }
      selectObject(previousSelection)
      window.dispatchEvent(new CustomEvent('mockframe-pathtrace', { detail: { enabled: false } }))
      window.dispatchEvent(new CustomEvent('mockframe-render-quality', { detail: { dpr: 2, shadowMapSize: 2048 } }))
      setRenderProgress(null)
    }
  }

  const pngToWebp = (pngUrl: string) => new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d')?.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/webp', quality / 100))
    }
    image.onerror = () => reject(new Error('Could not convert the captured image to WebP.'))
    image.src = pngUrl
  })

  const handleExport = async () => {
    if (!canvasRef.current) return
    setExporting(true)
    setError(null)
    try {
      const options = {
        pixelRatio: scale,
        skipFonts: false,
        backgroundColor: format === 'jpeg' ? '#ffffff' : undefined,
      }

      let dataUrl: string
      if (format === 'jpeg') {
        dataUrl = await withoutSelection(() => toJpeg(canvasRef.current!, { ...options, quality: quality / 100, backgroundColor: '#ffffff' }))
      } else if (format === 'webp') {
        const pngUrl = await withoutSelection(() => toPng(canvasRef.current!, options))
        dataUrl = await pngToWebp(pngUrl)
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
      setError(err instanceof Error ? err.message : 'Export failed. Try lowering output scale or GPU quality.')
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

  const outputWidth = Math.round((canvasRef.current?.clientWidth ?? 0) * scale)
  const outputHeight = Math.round((canvasRef.current?.clientHeight ?? 0) * scale)
  const estimatedMegapixels = (outputWidth * outputHeight / 1_000_000).toFixed(1)

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
          width: 440,
          maxHeight: '88vh',
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
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(88vh - 120px)' }}>
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

          {/* Output scale */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              <span>Output scale</span><span style={{ color: 'var(--accent)' }}>{scale.toFixed(1)}×</span>
            </div>
            <input type="range" min={1} max={8} step={0.5} value={scale} onChange={event => setScale(Number(event.target.value))} style={{ width: '100%' }} />
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>{outputWidth} × {outputHeight} · {estimatedMegapixels} MP</div>
          </div>

          <button onClick={() => setShowAdvanced(value => !value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, textAlign: 'left' }}>
            {showAdvanced ? '▾' : '▸'} Advanced GPU rendering
          </button>

          {showAdvanced && <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 10, color: 'var(--text-muted)' }}>
              <span><strong style={{ color: 'var(--text)', display: 'block', marginBottom: 2 }}>Ray tracing</strong>Experimental progressive GPU path tracing</span>
              <input type="checkbox" checked={rayTracing} onChange={event => setRayTracing(event.target.checked)} />
            </label>
            {rayTracing && <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}><span>Samples</span><span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{raySamples}</span></div>
                <input type="range" min={8} max={128} step={8} value={raySamples} onChange={event => setRaySamples(Number(event.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}><span>Light bounces</span><span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{rayBounces}</span></div>
                <input type="range" min={1} max={12} step={1} value={rayBounces} onChange={event => setRayBounces(Number(event.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.45 }}>Traces the 3D devices, physical materials, lights, and HDR environment. HTML text and shapes are composited after the traced pass.</div>
            </>}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}><span>GPU supersampling</span><span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{gpuDpr.toFixed(1)}×</span></div>
              <input type="range" min={1} max={4} step={0.5} value={gpuDpr} onChange={event => setGpuDpr(Number(event.target.value))} style={{ width: '100%' }} />
              <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.4 }}>Raises the actual Three.js render resolution before capture. 4× can use substantial GPU memory.</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}><span>Shadow resolution</span><span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{2 ** (shadowLevel + 9)}px</span></div>
              <input type="range" min={1} max={3} step={1} value={shadowLevel} onChange={event => setShadowLevel(Number(event.target.value))} style={{ width: '100%' }} />
            </div>
            {format !== 'png' && <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}><span>Compression quality</span><span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{quality}%</span></div>
              <input type="range" min={50} max={100} step={1} value={quality} onChange={event => setQuality(Number(event.target.value))} style={{ width: '100%' }} />
            </div>}
            <button onClick={() => { setScale(4); setGpuDpr(4); setShadowLevel(3); setQuality(100) }} style={{ padding: '7px 9px', borderRadius: 5, border: '1px solid var(--accent)', background: 'var(--accent-glow)', color: 'var(--accent)', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>Max GPU preset</button>
          </div>}

          {error && <div role="alert" style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(255,70,70,.08)', border: '1px solid rgba(255,90,90,.3)', color: 'var(--danger)', fontSize: 10, lineHeight: 1.4 }}>{error}</div>}

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
              <>{renderProgress ?? 'Exporting...'}</>
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
