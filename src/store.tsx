import { useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppState, Transform, DeviceConfig, Background, LightingConfig, SceneObject, DeviceType, ShapeType, TextConfig, ShapeConfig } from './types'
import { createSceneObject, createTextObject, createShapeObject, genId, defaultTransform, TEMPLATES } from './types'
import { EditorContext, type EditorContextValue } from './context.tsx'

// ── Sanitizer ─────────────────────────────────────────────────────────────────

export function sanitizeObjects(objects: SceneObject[]): SceneObject[] {
  return (objects ?? []).filter(o => {
    if (!o || !o.id) return false
    const et = o.elementType ?? 'device'
    if (et === 'device') return o.device?.type && o.transform && typeof o.transform.rotX === 'number'
    if (et === 'text') return o.transform && typeof o.transform.rotX === 'number'
    if (et === 'shape') return o.transform && typeof o.transform.rotX === 'number'
    return false
  }).map(o => ({
    ...o,
    elementType: o.elementType ?? 'device',
    screenshotType: o.screenshotType ?? null,
    device: o.device ?? { type: 'phone', color: 'space-black', orientation: 'portrait', showShadow: true, showReflection: true, screenBrightness: 1, materialPreset: 'default' },
  }))
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialObject = createSceneObject('monitor', 'Studio Monitor 1', { rotX: -3, rotY: 12, rotZ: 0, scale: 1.08 })

const initialState: AppState = {
  objects: [initialObject],
  selectedId: initialObject.id,
  background: {
    type: 'gradient-linear',
    color: '#0a0a14',
    gradientFrom: '#0f0c29',
    gradientTo: '#302b63',
    gradientAngle: 145,
  },
  lighting: {
    preset: 'soft-studio',
    intensity: 1,
    ambientIntensity: 0.6,
    shadowOpacity: 0.45,
    shadowSoftness: 60,
    rimLight: true,
    contactShadow: false,
  },
  activeTool: 'select',
  showExportModal: false,
  showTemplatesModal: false,
}

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_DEVICE'; payload: { deviceType: DeviceType } }
  | { type: 'ADD_TEXT' }
  | { type: 'ADD_SHAPE'; payload: { shape: ShapeType } }
  | { type: 'REMOVE_OBJECT'; payload: { id: string } }
  | { type: 'SELECT_OBJECT'; payload: { id: string | null } }
  | { type: 'DUPLICATE_OBJECT'; payload: { id: string } }
  | { type: 'UPDATE_OBJECT'; payload: { id: string; changes: Partial<Omit<SceneObject, 'id'>> } }
  | { type: 'UPDATE_OBJECT_DEVICE'; payload: { id: string; changes: Partial<DeviceConfig> } }
  | { type: 'UPDATE_OBJECT_TRANSFORM'; payload: { id: string; changes: Partial<Transform> } }
  | { type: 'UPDATE_OBJECT_TEXT'; payload: { id: string; changes: Partial<TextConfig> } }
  | { type: 'UPDATE_OBJECT_SHAPE'; payload: { id: string; changes: Partial<ShapeConfig> } }
  | { type: 'REORDER_OBJECTS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_BACKGROUND'; payload: Partial<Background> }
  | { type: 'SET_LIGHTING'; payload: Partial<LightingConfig> }
  | { type: 'SET_TOOL'; payload: AppState['activeTool'] }
  | { type: 'TOGGLE_EXPORT_MODAL' }
  | { type: 'TOGGLE_TEMPLATES_MODAL' }
  | { type: 'LOAD_TEMPLATE'; payload: { templateId: string } }
  | { type: 'IMPORT_PROJECT'; payload: AppState }
  | { type: 'ALIGN_OBJECTS'; payload: { axis: 'horizontal' | 'vertical' } }
  | { type: 'DISTRIBUTE_OBJECTS'; payload: { axis: 'horizontal' | 'vertical' } }

function updateObj(objects: SceneObject[], id: string, up: (o: SceneObject) => SceneObject): SceneObject[] {
  return objects.map(o => (o.id === id ? up(o) : o))
}

function offsetForNew(objects: SceneObject[]): Partial<Transform> {
  const n = objects.length
  return { posX: (n % 5) * 30 - 60, posY: (n % 3) * 20 - 20 }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_DEVICE': {
      const count = state.objects.filter(o => o.elementType === 'device' && o.device?.type === action.payload.deviceType).length + 1
      const obj = createSceneObject(action.payload.deviceType, `${action.payload.deviceType.charAt(0).toUpperCase() + action.payload.deviceType.slice(1)} ${count}`, offsetForNew(state.objects))
      return { ...state, objects: [...state.objects, obj], selectedId: obj.id }
    }
    case 'ADD_TEXT': {
      const count = state.objects.filter(o => o.elementType === 'text').length + 1
      const obj = createTextObject(`Text ${count}`, offsetForNew(state.objects))
      return { ...state, objects: [...state.objects, obj], selectedId: obj.id }
    }
    case 'ADD_SHAPE': {
      const count = state.objects.filter(o => o.elementType === 'shape' && o.shapeConfig?.shape === action.payload.shape).length + 1
      const obj = createShapeObject(action.payload.shape, `${action.payload.shape.charAt(0).toUpperCase() + action.payload.shape.slice(1)} ${count}`, offsetForNew(state.objects))
      return { ...state, objects: [...state.objects, obj], selectedId: obj.id }
    }
    case 'REMOVE_OBJECT': {
      const remaining = state.objects.filter(o => o.id !== action.payload.id)
      const newSel = state.selectedId === action.payload.id ? (remaining[remaining.length - 1]?.id ?? null) : state.selectedId
      return { ...state, objects: remaining, selectedId: newSel }
    }
    case 'SELECT_OBJECT':
      return { ...state, selectedId: action.payload.id }
    case 'DUPLICATE_OBJECT': {
      const src = state.objects.find(o => o.id === action.payload.id)
      if (!src) return state
      const copy: SceneObject = { ...src, id: genId(), name: src.name + ' Copy', transform: { ...src.transform, posX: src.transform.posX + 30, posY: src.transform.posY + 20 } }
      const idx = state.objects.findIndex(o => o.id === action.payload.id)
      return { ...state, objects: [...state.objects.slice(0, idx + 1), copy, ...state.objects.slice(idx + 1)], selectedId: copy.id }
    }
    case 'UPDATE_OBJECT':
      return { ...state, objects: updateObj(state.objects, action.payload.id, o => ({ ...o, ...action.payload.changes })) }
    case 'UPDATE_OBJECT_DEVICE':
      return { ...state, objects: updateObj(state.objects, action.payload.id, o => ({ ...o, device: { ...o.device, ...action.payload.changes } })) }
    case 'UPDATE_OBJECT_TRANSFORM':
      return { ...state, objects: updateObj(state.objects, action.payload.id, o => ({ ...o, transform: { ...o.transform, ...action.payload.changes } })) }
    case 'UPDATE_OBJECT_TEXT':
      return { ...state, objects: updateObj(state.objects, action.payload.id, o => ({ ...o, textConfig: { ...o.textConfig!, ...action.payload.changes } })) }
    case 'UPDATE_OBJECT_SHAPE':
      return { ...state, objects: updateObj(state.objects, action.payload.id, o => ({ ...o, shapeConfig: { ...o.shapeConfig!, ...action.payload.changes } })) }
    case 'REORDER_OBJECTS': {
      const arr = [...state.objects]
      const [item] = arr.splice(action.payload.fromIndex, 1)
      arr.splice(action.payload.toIndex, 0, item)
      return { ...state, objects: arr }
    }
    case 'SET_BACKGROUND':
      return { ...state, background: { ...state.background, ...action.payload } }
    case 'SET_LIGHTING':
      return { ...state, lighting: { ...state.lighting, ...action.payload } }
    case 'SET_TOOL':
      return { ...state, activeTool: action.payload }
    case 'TOGGLE_EXPORT_MODAL':
      return { ...state, showExportModal: !state.showExportModal }
    case 'TOGGLE_TEMPLATES_MODAL':
      return { ...state, showTemplatesModal: !state.showTemplatesModal }
    case 'LOAD_TEMPLATE': {
      const tpl = TEMPLATES.find(t => t.id === action.payload.templateId)
      if (!tpl) return state
      const objects: SceneObject[] = tpl.objects.map(o => ({ ...o, id: genId() }))
      return { ...state, objects, selectedId: objects[0]?.id ?? null, background: { ...state.background, ...tpl.background }, showTemplatesModal: false }
    }
    case 'IMPORT_PROJECT':
      return { ...action.payload, objects: sanitizeObjects(action.payload.objects ?? []), showExportModal: false, showTemplatesModal: false }
    case 'ALIGN_OBJECTS': {
      const visible = state.objects.filter(o => o.visible && !o.locked)
      if (visible.length < 2) return state
      if (action.payload.axis === 'horizontal') {
        const avg = visible.reduce((s, o) => s + o.transform.posY, 0) / visible.length
        const ids = new Set(visible.map(o => o.id))
        return { ...state, objects: state.objects.map(o => ids.has(o.id) ? { ...o, transform: { ...o.transform, posY: avg } } : o) }
      } else {
        const avg = visible.reduce((s, o) => s + o.transform.posX, 0) / visible.length
        const ids = new Set(visible.map(o => o.id))
        return { ...state, objects: state.objects.map(o => ids.has(o.id) ? { ...o, transform: { ...o.transform, posX: avg } } : o) }
      }
    }
    case 'DISTRIBUTE_OBJECTS': {
      const visible = state.objects.filter(o => o.visible && !o.locked)
      if (visible.length < 3) return state
      if (action.payload.axis === 'horizontal') {
        const sorted = [...visible].sort((a, b) => a.transform.posX - b.transform.posX)
        const min = sorted[0].transform.posX, max = sorted[sorted.length - 1].transform.posX
        const step = (max - min) / (sorted.length - 1)
        const map = new Map(sorted.map((o, i) => [o.id, min + i * step]))
        return { ...state, objects: state.objects.map(o => map.has(o.id) ? { ...o, transform: { ...o.transform, posX: map.get(o.id)! } } : o) }
      } else {
        const sorted = [...visible].sort((a, b) => a.transform.posY - b.transform.posY)
        const min = sorted[0].transform.posY, max = sorted[sorted.length - 1].transform.posY
        const step = (max - min) / (sorted.length - 1)
        const map = new Map(sorted.map((o, i) => [o.id, min + i * step]))
        return { ...state, objects: state.objects.map(o => map.has(o.id) ? { ...o, transform: { ...o.transform, posY: map.get(o.id)! } } : o) }
      }
    }
    default:
      return state
  }
}

// ── URL share helpers ─────────────────────────────────────────────────────────

export function encodeProjectToUrl(state: AppState): string {
  // Strip large binary data (screenshots, videos) to keep URL manageable
  const slim = {
    ...state,
    objects: state.objects.map(o => ({
      ...o,
      // Keep text content of screenshot URLs only for small data URIs (< 50KB)
      screenshot: o.screenshot && o.screenshot.length < 50000 ? o.screenshot : null,
      screenshotType: o.screenshot && o.screenshot.length < 50000 ? o.screenshotType : null,
    })),
    showExportModal: false,
    showTemplatesModal: false,
  }
  try {
    return '#project=' + btoa(unescape(encodeURIComponent(JSON.stringify(slim))))
  } catch {
    return ''
  }
}

export function decodeProjectFromUrl(hash: string): AppState | null {
  try {
    if (!hash.startsWith('#project=')) return null
    const json = decodeURIComponent(escape(atob(hash.slice(9))))
    return JSON.parse(json) as AppState
  } catch {
    return null
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const selectedObject = state.objects.find(o => o.id === state.selectedId) ?? null

  const addDevice = useCallback((deviceType: DeviceType) => dispatch({ type: 'ADD_DEVICE', payload: { deviceType } }), [])
  const addText = useCallback(() => dispatch({ type: 'ADD_TEXT' }), [])
  const addShape = useCallback((shape: ShapeType) => dispatch({ type: 'ADD_SHAPE', payload: { shape } }), [])
  const removeObject = useCallback((id: string) => dispatch({ type: 'REMOVE_OBJECT', payload: { id } }), [])
  const selectObject = useCallback((id: string | null) => dispatch({ type: 'SELECT_OBJECT', payload: { id } }), [])
  const duplicateObject = useCallback((id: string) => dispatch({ type: 'DUPLICATE_OBJECT', payload: { id } }), [])
  const updateObject = useCallback((id: string, changes: Partial<Omit<SceneObject, 'id'>>) => dispatch({ type: 'UPDATE_OBJECT', payload: { id, changes } }), [])
  const updateDevice = useCallback((id: string, changes: Partial<DeviceConfig>) => dispatch({ type: 'UPDATE_OBJECT_DEVICE', payload: { id, changes } }), [])
  const updateTransform = useCallback((id: string, changes: Partial<Transform>) => dispatch({ type: 'UPDATE_OBJECT_TRANSFORM', payload: { id, changes } }), [])
  const updateText = useCallback((id: string, changes: Partial<TextConfig>) => dispatch({ type: 'UPDATE_OBJECT_TEXT', payload: { id, changes } }), [])
  const updateShape = useCallback((id: string, changes: Partial<ShapeConfig>) => dispatch({ type: 'UPDATE_OBJECT_SHAPE', payload: { id, changes } }), [])
  const reorderObjects = useCallback((fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_OBJECTS', payload: { fromIndex, toIndex } }), [])
  const setBackground = useCallback((b: Partial<Background>) => dispatch({ type: 'SET_BACKGROUND', payload: b }), [])
  const setLighting = useCallback((l: Partial<LightingConfig>) => dispatch({ type: 'SET_LIGHTING', payload: l }), [])
  const setTool = useCallback((tool: AppState['activeTool']) => dispatch({ type: 'SET_TOOL', payload: tool }), [])
  const toggleExportModal = useCallback(() => dispatch({ type: 'TOGGLE_EXPORT_MODAL' }), [])
  const toggleTemplatesModal = useCallback(() => dispatch({ type: 'TOGGLE_TEMPLATES_MODAL' }), [])
  const loadTemplate = useCallback((templateId: string) => dispatch({ type: 'LOAD_TEMPLATE', payload: { templateId } }), [])
  const importProject = useCallback((s: AppState) => dispatch({ type: 'IMPORT_PROJECT', payload: s }), [])
  const alignObjects = useCallback((axis: 'horizontal' | 'vertical') => dispatch({ type: 'ALIGN_OBJECTS', payload: { axis } }), [])
  const distributeObjects = useCallback((axis: 'horizontal' | 'vertical') => dispatch({ type: 'DISTRIBUTE_OBJECTS', payload: { axis } }), [])

  return (
    <EditorContext.Provider value={{ state, selectedObject, addDevice, addText, addShape, removeObject, selectObject, duplicateObject, updateObject, updateDevice, updateTransform, updateText, updateShape, reorderObjects, setBackground, setLighting, setTool, toggleExportModal, toggleTemplatesModal, loadTemplate, importProject, alignObjects, distributeObjects }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
