import { useState, useRef } from 'react'
import { toPng, toJpeg, toBlob } from 'html-to-image'
import { IconCheck, IconClipboard, IconDownload, IconX } from '@tabler/icons-react'
import { Button, ButtonBlock, SidebarSlider } from '../kit'
import { Hint, Section, SwitchRow } from './studio-ui'
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
  const [raySamples, setRaySamples] = useState(64)
  const [rayBounces, setRayBounces] = useState(6)
  const [reduceFireflies, setReduceFireflies] = useState(true)
  const [renderProgress, setRenderProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const withoutSelection = async <T,>(capture: () => Promise<T>) => {
    const previousSelection = state.selectedId
    const previousClassName = canvasRef.current?.className ?? ''
    const previousBackground = canvasRef.current?.style.background ?? ''
    let frozenWebglFrame: HTMLImageElement | null = null
    let webglCanvas: HTMLCanvasElement | null = null
    let previousCanvasVisibility = ''
    selectObject(null)
    window.dispatchEvent(new CustomEvent('mockframe-render-quality', { detail: { dpr: gpuDpr, shadowMapSize: 2 ** (shadowLevel + 9) } }))
    if (state.background.type === 'transparent' && canvasRef.current) {
      canvasRef.current.classList.remove('checkerboard')
      canvasRef.current.style.background = 'transparent'
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    if (rayTracing) {
      await new Promise<void>((resolve, reject) => {
        const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
        // WebGL path tracing can run substantially slower on Apple GPUs,
        // particularly at high DPR and 256–512 samples. Give Macs up to an
        // hour and scale the floor with sample count instead of aborting an
        // otherwise healthy render after only a few minutes.
        const timeoutMs = isMac
          ? Math.min(60 * 60_000, Math.max(30 * 60_000, raySamples * 15_000))
          : Math.min(30 * 60_000, Math.max(10 * 60_000, raySamples * 8_000))
        const timeout = window.setTimeout(() => finish(new Error('Ray tracing timed out. Try fewer samples or a lower GPU setting.')), timeoutMs)
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
        // A strong glossy filter removes fireflies, but it also suppresses the
        // indirect specular paths that make dark metal readable. Keep the
        // filter deliberately gentle and rely primarily on the higher sample
        // count for cleanup.
        window.dispatchEvent(new CustomEvent('mockframe-pathtrace', { detail: { enabled: true, samples: raySamples, bounces: rayBounces, filterGlossyFactor: reduceFireflies ? 0.12 : 0 } }))
      })
    }
    try {
      // html-to-image has to clone the live WebGL canvas. Safari can produce a
      // transparent clone after a long or high-resolution GPU render, leaving
      // every device absent from the export. Freeze the completed framebuffer
      // into a regular image before DOM capture so the compositing step is
      // deterministic across browsers.
      webglCanvas = canvasRef.current?.querySelector('canvas') ?? null
      if (webglCanvas?.parentElement) {
        const frameUrl = webglCanvas.toDataURL('image/png')
        frozenWebglFrame = document.createElement('img')
        frozenWebglFrame.src = frameUrl
        frozenWebglFrame.alt = ''
        frozenWebglFrame.setAttribute('aria-hidden', 'true')
        Object.assign(frozenWebglFrame.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        })
        await frozenWebglFrame.decode()
        webglCanvas.parentElement.appendChild(frozenWebglFrame)
        previousCanvasVisibility = webglCanvas.style.visibility
        webglCanvas.style.visibility = 'hidden'
      }
      return await capture()
    } finally {
      frozenWebglFrame?.remove()
      if (webglCanvas) webglCanvas.style.visibility = previousCanvasVisibility
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
      link.download = `uiforma-mockup.${format === 'jpeg' ? 'jpg' : format}`
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
    <div className="studio-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="export-dialog-title" className="studio-modal" style={{ width: 560 }}>
        <div className="studio-modal__header">
          <h2 id="export-dialog-title">Export</h2>
          <Button appearance="surface" size="compact" className="studio-toolbar-button" aria-label="Close export dialog" leadingIcon={<IconX />} onClick={onClose} />
        </div>

        <div className="studio-modal__body">
          <div className="studio-field">
            <span className="studio-field__label">Format</span>
            <ButtonBlock className="studio-block-3" label="Format" value={format} onValueChange={setFormat} items={formats.map(f => ({ value: f.id, label: f.label }))} />
            <Hint>{format === 'png' ? 'PNG keeps transparent backgrounds.' : `${format === 'jpeg' ? 'JPG' : 'WebP'} has no transparency; the background is flattened.`}</Hint>
          </div>

          <div className="studio-field">
            <SidebarSlider label="Output scale" value={scale} min={1} max={8} step={0.5} formatValue={v => `${v.toFixed(1)}×`} onValueChange={setScale} />
            <Hint>{outputWidth} × {outputHeight} · {estimatedMegapixels} MP · no watermark</Hint>
          </div>

          <Section title="Advanced GPU rendering" spacing="tight" open={showAdvanced} onOpenChange={setShowAdvanced}>
            <SwitchRow label="Ray tracing" checked={rayTracing} onCheckedChange={setRayTracing} />
            {rayTracing && <>
              <Hint>Experimental progressive GPU path tracing.</Hint>
              <SidebarSlider label="Samples" value={raySamples} min={8} max={512} step={8} formatValue={v => String(v)} onValueChange={setRaySamples} />
              <SidebarSlider label="Bounces" value={rayBounces} min={1} max={12} step={1} formatValue={v => String(v)} onValueChange={setRayBounces} />
              <SwitchRow label="Reduce speckles" checked={reduceFireflies} onCheckedChange={setReduceFireflies} />
            </>}
            <SidebarSlider label="Supersample" value={gpuDpr} min={1} max={4} step={0.5} formatValue={v => `${v.toFixed(1)}×`} onValueChange={setGpuDpr} />
            <SidebarSlider label="Shadow res" value={shadowLevel} min={1} max={3} step={1} formatValue={v => `${2 ** (v + 9)}px`} onValueChange={setShadowLevel} />
            {format !== 'png' && <SidebarSlider label="Quality" value={quality} min={50} max={100} step={1} formatValue={v => `${v}%`} onValueChange={setQuality} />}
            <Hint>Supersampling raises the real Three.js render resolution before capture. 4× can use a lot of GPU memory.</Hint>
            <Button appearance="secondary" size="compact" onClick={() => { setScale(4); setGpuDpr(4); setShadowLevel(3); setQuality(100); setRaySamples(256); setReduceFireflies(true) }}>Max GPU preset</Button>
          </Section>

          {error && <div role="alert" className="studio-alert">{error}</div>}
        </div>

        <div className="studio-modal__footer">
          <Button appearance="surface" size="compact" leadingIcon={<IconClipboard />} disabled={exporting} onClick={handleCopyToClipboard}>Copy</Button>
          <Button appearance="primary" size="compact" style={{ flex: 1 }} loading={exporting} leadingIcon={done ? <IconCheck /> : <IconDownload />} onClick={handleExport}>
            {exporting ? (renderProgress ?? 'Exporting…') : done ? 'Downloaded' : `Download ${format === 'jpeg' ? 'JPG' : format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
