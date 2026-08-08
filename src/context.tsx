import { createContext } from 'react'
import type { AppState, Transform, DeviceConfig, Background, LightingConfig, SceneObject, DeviceType, ShapeType, TextConfig, ShapeConfig, LayoutPattern, PatternPlane, PatternAxis, RotationFollowAxis, CopyMode } from './types'

export interface EditorContextValue {
  state: AppState
  selectedObject: SceneObject | null
  addDevice: (deviceType: DeviceType) => void
  addText: () => void
  addShape: (shape: ShapeType) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null) => void
  duplicateObject: (id: string) => void
  updateObject: (id: string, changes: Partial<Omit<SceneObject, 'id'>>) => void
  updateDevice: (id: string, changes: Partial<DeviceConfig>) => void
  updateTransform: (id: string, changes: Partial<Transform>) => void
  updateText: (id: string, changes: Partial<TextConfig>) => void
  updateShape: (id: string, changes: Partial<ShapeConfig>) => void
  reorderObjects: (fromIndex: number, toIndex: number) => void
  setBackground: (b: Partial<Background>) => void
  setLighting: (l: Partial<LightingConfig>) => void
  setTool: (tool: AppState['activeTool']) => void
  toggleExportModal: () => void
  toggleTemplatesModal: () => void
  loadTemplate: (templateId: string) => void
  importProject: (state: AppState) => void
  alignObjects: (axis: 'horizontal' | 'vertical') => void
  distributeObjects: (axis: 'horizontal' | 'vertical') => void
  applyLayout: (pattern: LayoutPattern, spacing: number, depth: number, curve: number, plane?: PatternPlane, mirrorAxis?: PatternAxis, rotationAxis?: RotationFollowAxis) => void
  generatePattern: (pattern: LayoutPattern, spacing: number, depth: number, curve: number, count: number, mode: CopyMode, plane: PatternPlane, mirrorAxis: PatternAxis, rotationAxis: RotationFollowAxis) => void
}

export const EditorContext = createContext<EditorContextValue | null>(null)
