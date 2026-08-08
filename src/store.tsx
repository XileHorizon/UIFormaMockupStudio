import { useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppState, Transform, DeviceConfig, Background, LightingConfig, SceneObject, DeviceType, ShapeType, TextConfig, ShapeConfig, LayoutPattern, PatternPlane, PatternAxis, RotationFollowAxis, CopyMode } from './types'
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
    transform: { ...o.transform, posZ: o.transform.posZ ?? 0 },
    elementType: o.elementType ?? 'device',
    screenshotType: o.screenshotType ?? null,
    device: {
      ...(o.device ?? { type: 'phone', color: 'space-black', orientation: 'portrait', showShadow: true, showReflection: true, screenBrightness: 1, materialPreset: 'default' }),
      screenOffsetX: o.device?.screenOffsetX ?? 0,
      screenOffsetY: o.device?.screenOffsetY ?? 0,
      screenScale: o.device?.screenScale ?? 1,
    },
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
    keyIntensity: 0.88,
    fillIntensity: 0.24,
    rimIntensity: 0.58,
    environmentIntensity: 0.26,
    environmentRotation: -26,
    colorTemperature: 5200,
    keyAzimuth: -35,
    keyElevation: 42,
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
  | { type: 'APPLY_LAYOUT'; payload: { pattern: LayoutPattern; spacing: number; depth: number; curve: number; plane?: PatternPlane; mirrorAxis?: PatternAxis; rotationAxis?: RotationFollowAxis; targetIds?: string[]; asOffsets?: boolean } }
  | { type: 'GENERATE_PATTERN'; payload: { pattern: LayoutPattern; spacing: number; depth: number; curve: number; count: number; mode: CopyMode; plane: PatternPlane; mirrorAxis: PatternAxis; rotationAxis: RotationFollowAxis } }

function updateObj(objects: SceneObject[], id: string, up: (o: SceneObject) => SceneObject): SceneObject[] {
  return objects.map(o => (o.id === id ? up(o) : o))
}

function linkedIds(objects: SceneObject[], id: string): Set<string> {
  const source = objects.find(o => o.id === id)
  if (!source?.linkedGroupId) return new Set([id])
  return new Set(objects.filter(o => o.linkedGroupId === source.linkedGroupId).map(o => o.id))
}

function offsetForNew(objects: SceneObject[]): Partial<Transform> {
  const n = objects.length
  // Canvas transforms are converted to Three.js units at roughly 95 px/unit.
  // Imported devices are 4-6 units across, so the old 20-30 px offsets made
  // every newly-added model occupy effectively the same point in space.
  const slots = [
    { posX: 0, posY: 0 },
    { posX: 320, posY: 0 },
    { posX: -320, posY: 0 },
    { posX: 0, posY: 280 },
    { posX: 320, posY: 280 },
    { posX: -320, posY: 280 },
  ]
  const slot = slots[n % slots.length]
  const page = Math.floor(n / slots.length)
  return { posX: slot.posX + page * 45, posY: slot.posY + page * 45 }
}

const DEVICE_NAMES: Partial<Record<DeviceType, string>> = {
  'studio-display': 'Studio Display',
  'macbook-air': 'MacBook Air',
  'iphone-17-pro': 'iPhone 17 Pro',
  'ipad-pro': 'iPad Pro',
  'laptop-3d': 'Laptop 3D',
  'imac-2021': 'iMac 2021',
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_DEVICE': {
      const count = state.objects.filter(o => o.elementType === 'device' && o.device?.type === action.payload.deviceType).length + 1
      const label = DEVICE_NAMES[action.payload.deviceType] ?? action.payload.deviceType.charAt(0).toUpperCase() + action.payload.deviceType.slice(1)
      const obj = createSceneObject(action.payload.deviceType, `${label} ${count}`, offsetForNew(state.objects))
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
      const copy: SceneObject = { ...src, id: genId(), name: src.name + ' Copy', transform: { ...src.transform, posX: src.transform.posX + 160, posY: src.transform.posY + 90 } }
      const idx = state.objects.findIndex(o => o.id === action.payload.id)
      return { ...state, objects: [...state.objects.slice(0, idx + 1), copy, ...state.objects.slice(idx + 1)], selectedId: copy.id }
    }
    case 'UPDATE_OBJECT': {
      const ids = linkedIds(state.objects, action.payload.id)
      // Screen/media edits synchronize; structural and per-copy fields remain local.
      const shared = Object.fromEntries(Object.entries(action.payload.changes).filter(([key]) => ['screenshot', 'screenshotType'].includes(key)))
      return { ...state, objects: state.objects.map(o => o.id === action.payload.id
        ? { ...o, ...action.payload.changes }
        : ids.has(o.id) ? { ...o, ...shared } : o) }
    }
    case 'UPDATE_OBJECT_DEVICE': {
      const ids = linkedIds(state.objects, action.payload.id)
      return { ...state, objects: state.objects.map(o => ids.has(o.id) ? { ...o, device: { ...o.device, ...action.payload.changes } } : o) }
    }
    case 'UPDATE_OBJECT_TRANSFORM': {
      const source = state.objects.find(o => o.id === action.payload.id)
      if (!source?.linkedGroupId) {
        return { ...state, objects: updateObj(state.objects, action.payload.id, o => ({ ...o, transform: { ...o.transform, ...action.payload.changes } })) }
      }

      // Treat edits to any live-linked member as deltas from its current
      // transform. Applying those deltas to every member preserves the unique
      // offsets and angles calculated by the pattern (the radial/kaleidoscope
      // effect) while the whole group responds continuously to the drag.
      const linearKeys: (keyof Transform)[] = ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ']
      const deltas = new Map<keyof Transform, number>()
      linearKeys.forEach(key => {
        const value = action.payload.changes[key]
        if (typeof value === 'number') deltas.set(key, value - source.transform[key])
      })
      const scaleRatio = typeof action.payload.changes.scale === 'number' && source.transform.scale !== 0
        ? action.payload.changes.scale / source.transform.scale
        : null

      return {
        ...state,
        objects: state.objects.map(o => {
          if (o.linkedGroupId !== source.linkedGroupId) return o
          const transform = { ...o.transform }
          deltas.forEach((delta, key) => { transform[key] += delta })
          if (scaleRatio != null) transform.scale *= scaleRatio
          return { ...o, transform }
        }),
      }
    }
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
    case 'APPLY_LAYOUT': {
      const targetIdSet = action.payload.targetIds ? new Set(action.payload.targetIds) : null
      const targets = state.objects.filter(o => (!targetIdSet || targetIdSet.has(o.id)) && o.visible && !o.locked && (o.elementType === 'device' || o.elementType == null))
      if (targets.length < 2) return state
      const ids = new Set(targets.map(o => o.id))
      const middle = (targets.length - 1) / 2
      const { pattern, spacing, depth, curve } = action.payload
      const plane = action.payload.plane ?? 'xy'
      const mirrorAxis = action.payload.mirrorAxis ?? 'x'
      const rotationAxis = action.payload.rotationAxis ?? 'none'
      const columns = Math.ceil(Math.sqrt(targets.length))
      const rows = Math.ceil(targets.length / columns)
      const transforms = new Map<string, Partial<Transform>>()

      targets.forEach((object, index) => {
        const offset = index - middle
        let next: Partial<Transform> = { posX: offset * spacing, posY: 0, posZ: offset * depth }
        let followAngle = 0
        if (pattern === 'fan') {
          followAngle = offset * curve * 0.16
          next = { posX: offset * spacing * 0.72, posY: Math.abs(offset) * curve * 0.42, posZ: -Math.abs(offset) * depth }
        } else if (pattern === 'arc') {
          followAngle = offset * curve * 0.12
          next = { posX: offset * spacing, posY: offset * offset * curve * 0.12, posZ: -Math.abs(offset) * depth }
        } else if (pattern === 'staircase') {
          followAngle = offset * curve * 0.08
          next = { posX: offset * spacing, posY: -offset * curve, posZ: offset * depth }
        } else if (pattern === 'grid') {
          const row = Math.floor(index / columns), col = index % columns
          next = { posX: (col - (columns - 1) / 2) * spacing, posY: (row - (rows - 1) / 2) * spacing * 0.8, posZ: row * depth }
        } else if (pattern === 'rainbow') {
          const angle = targets.length === 1 ? 0 : (index / (targets.length - 1) - 0.5) * Math.PI * 0.9
          followAngle = angle * 180 / Math.PI
          next = { posX: Math.sin(angle) * spacing * Math.max(1.5, targets.length * 0.42), posY: (1 - Math.cos(angle)) * curve * 1.5, posZ: -Math.abs(offset) * depth }
        } else if (pattern === 'mirror') {
          const side = index % 2 === 0 ? -1 : 1
          const tier = Math.floor(index / 2) + 0.5
          followAngle = side * Math.min(90, curve)
          next = { posX: mirrorAxis === 'x' ? side * tier * spacing : 0, posY: mirrorAxis === 'y' ? side * tier * spacing : Math.floor(index / 2) * curve, posZ: mirrorAxis === 'z' ? side * tier * spacing : -Math.floor(index / 2) * depth }
        } else if (pattern === 'ring') {
          // A kaleidoscopic radial array: every member shares the parent's
          // exact pivot and position. Only its local rotation advances by
          // 360/N (0, 60, 120... for six members). This intentionally differs
          // from Orbit, which distributes objects spatially around a curve.
          followAngle = index * (360 / targets.length)
          next = { posX: 0, posY: 0, posZ: 0 }
        }
        if (pattern !== 'mirror') {
          const u = next.posX ?? 0, v = next.posY ?? 0, w = next.posZ ?? 0
          if (plane === 'xz') next = { ...next, posX: u, posY: w, posZ: v }
          if (plane === 'yz') next = { ...next, posX: w, posY: u, posZ: v }
        }
        if (rotationAxis !== 'none') {
          const key = `rot${rotationAxis.toUpperCase()}` as 'rotX' | 'rotY' | 'rotZ'
          next = { ...next, [key]: object.transform[key] + followAngle }
        }
        transforms.set(object.id, next)
      })
      return { ...state, objects: state.objects.map(o => {
        if (!ids.has(o.id)) return o
        const calculated = transforms.get(o.id)!
        if (!action.payload.asOffsets) return { ...o, patternTransform: undefined, patternType: undefined, patternPlane: undefined, patternRotationAxis: undefined, transform: { ...o.transform, ...calculated } }
        const patternTransform: Partial<Transform> = {
          posX: calculated.posX ?? 0,
          posY: calculated.posY ?? 0,
          posZ: calculated.posZ ?? 0,
        }
        ;(['rotX', 'rotY', 'rotZ'] as const).forEach(key => {
          if (typeof calculated[key] === 'number') patternTransform[key] = calculated[key]! - o.transform[key]
        })
        return { ...o, patternTransform, patternType: pattern, patternPlane: plane, patternRotationAxis: rotationAxis }
      }) }
    }
    case 'GENERATE_PATTERN': {
      const source = state.objects.find(o => o.id === state.selectedId && (o.elementType === 'device' || o.elementType == null))
      if (!source) return state
      const count = Math.max(2, Math.min(32, action.payload.count))
      const linked = action.payload.mode === 'linked'
      const groupId = linked ? (source.linkedGroupId ?? genId()) : undefined
      const retained = groupId ? state.objects.filter(o => o.linkedGroupId !== groupId || o.id === source.id) : state.objects
      const copies: SceneObject[] = Array.from({ length: count }, (_, index) => ({
        ...source,
        id: index === 0 ? source.id : genId(),
        name: index === 0 ? source.name : `${source.name} ${index + 1}`,
        device: { ...source.device },
        transform: { ...source.transform },
        patternTransform: undefined,
        patternType: undefined,
        patternPlane: undefined,
        patternRotationAxis: undefined,
        linkedGroupId: groupId,
        linkedIndex: linked ? index : undefined,
      }))
      const temporary = { ...state, objects: [...retained.filter(o => o.id !== source.id), ...copies], selectedId: source.id }
      return reducer(temporary, { type: 'APPLY_LAYOUT', payload: { ...action.payload, targetIds: copies.map(o => o.id), asOffsets: linked } })
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
  const applyLayout = useCallback((pattern: LayoutPattern, spacing: number, depth: number, curve: number, plane?: PatternPlane, mirrorAxis?: PatternAxis, rotationAxis?: RotationFollowAxis) => dispatch({ type: 'APPLY_LAYOUT', payload: { pattern, spacing, depth, curve, plane, mirrorAxis, rotationAxis } }), [])
  const generatePattern = useCallback((pattern: LayoutPattern, spacing: number, depth: number, curve: number, count: number, mode: CopyMode, plane: PatternPlane, mirrorAxis: PatternAxis, rotationAxis: RotationFollowAxis) => dispatch({ type: 'GENERATE_PATTERN', payload: { pattern, spacing, depth, curve, count, mode, plane, mirrorAxis, rotationAxis } }), [])

  return (
    <EditorContext.Provider value={{ state, selectedObject, addDevice, addText, addShape, removeObject, selectObject, duplicateObject, updateObject, updateDevice, updateTransform, updateText, updateShape, reorderObjects, setBackground, setLighting, setTool, toggleExportModal, toggleTemplatesModal, loadTemplate, importProject, alignObjects, distributeObjects, applyLayout, generatePattern }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
