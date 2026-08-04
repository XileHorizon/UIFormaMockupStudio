import { useRef, useEffect } from 'react'
import { EditorProvider, useEditor } from './store'
import TopToolbar from './components/TopToolbar'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import Canvas3D from './components/Canvas3D'
import ExportModal from './components/ExportModal'
import TemplatesModal from './components/TemplatesModal'

function Editor() {
  const { state, selectedObject, setTool, toggleExportModal, toggleTemplatesModal, duplicateObject, removeObject } = useEditor()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if ((e.metaKey || e.ctrlKey) && e.key === 'e') { e.preventDefault(); toggleExportModal(); return }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); if (selectedObject) duplicateObject(selectedObject.id); return }

      switch (e.key) {
        case 'v': case 'V': setTool('select'); break
        case 'w': case 'W': setTool('move');   break
        case 'e': case 'E': setTool('rotate');  break
        case 'r': case 'R': setTool('scale');   break
        case 'Delete':
        case 'Backspace':
          if (selectedObject) removeObject(selectedObject.id)
          break
        case 'F':
        case 'f':
          toggleTemplatesModal()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedObject, setTool, toggleExportModal, toggleTemplatesModal, duplicateObject, removeObject])

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <TopToolbar onExport={toggleExportModal} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <LeftSidebar />
        <Canvas3D canvasRef={canvasRef} />
        <RightSidebar />
      </div>

      {state.showExportModal && (
        <ExportModal canvasRef={canvasRef} onClose={toggleExportModal} />
      )}

      {state.showTemplatesModal && (
        <TemplatesModal />
      )}
    </div>
  )
}

export default function App() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  )
}
