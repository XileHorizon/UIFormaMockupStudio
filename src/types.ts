// ── Element types ─────────────────────────────────────────────────────────────

export type ElementType = 'device' | 'text' | 'shape'
export type DeviceType = 'phone' | 'laptop' | 'tablet' | 'monitor' | 'browser'
export type DeviceColor = 'space-black' | 'silver' | 'white' | 'gold'
export type ShapeType = 'card' | 'ring' | 'blob' | 'pedestal' | 'plane'
export type ScreenContentType = 'image' | 'video' | 'gif' | null

export type MaterialPresetId = 'default' | 'glass' | 'frosted' | 'holographic' | 'matte' | 'neon'

export type LightingPreset =
  | 'soft-studio' | 'bright-product' | 'dark-dramatic'
  | 'cool-technology' | 'warm-editorial' | 'minimal-portfolio'

export type BackgroundType =
  | 'transparent' | 'solid' | 'gradient-linear' | 'gradient-radial' | 'grid' | 'blob'

export type AnglePreset =
  | 'front' | 'slight-left' | 'slight-right' | 'top-down'
  | 'iso-left' | 'iso-right' | 'dramatic-low' | 'floating-quarter'

// ── Sub-configs ───────────────────────────────────────────────────────────────

export interface Transform {
  rotX: number
  rotY: number
  rotZ: number
  posX: number
  posY: number
  scale: number
}

export interface Background {
  type: BackgroundType
  color: string
  gradientFrom: string
  gradientTo: string
  gradientAngle: number
}

export interface LightingConfig {
  preset: LightingPreset
  intensity: number
  ambientIntensity: number
  shadowOpacity: number
  shadowSoftness: number
  rimLight: boolean
  contactShadow: boolean
}

export interface DeviceConfig {
  type: DeviceType
  color: DeviceColor
  orientation: 'portrait' | 'landscape'
  showShadow: boolean
  showReflection: boolean
  screenBrightness: number
  materialPreset: MaterialPresetId
}

export interface TextConfig {
  content: string
  fontSize: number
  fontWeight: 300 | 400 | 500 | 600 | 700 | 800
  color: string
  fontFamily: 'sans' | 'serif' | 'mono'
  letterSpacing: number
  lineHeight: number
  maxWidth: number
  align: 'left' | 'center' | 'right'
  opacity: number
}

export interface ShapeConfig {
  shape: ShapeType
  color: string
  secondaryColor: string
  width: number
  height: number
  borderRadius: number
  opacity: number
  blur: number
  showShadow: boolean
}

export interface SceneObject {
  id: string
  name: string
  elementType: ElementType
  device: DeviceConfig
  transform: Transform
  screenshot: string | null
  screenshotType: ScreenContentType
  textConfig?: TextConfig
  shapeConfig?: ShapeConfig
  visible: boolean
  locked: boolean
}

export interface AppState {
  objects: SceneObject[]
  selectedId: string | null
  background: Background
  lighting: LightingConfig
  activeTool: 'select' | 'move' | 'rotate' | 'scale'
  showExportModal: boolean
  showTemplatesModal: boolean
}

// ── Material presets ──────────────────────────────────────────────────────────

export interface MaterialPreset {
  label: string
  deviceFilter: string
  bodyOverlay: string
  screenOverlay: string
}

export const MATERIAL_PRESETS: Record<MaterialPresetId, MaterialPreset> = {
  default: {
    label: 'Default',
    deviceFilter: '',
    bodyOverlay: 'transparent',
    screenOverlay: 'transparent',
  },
  glass: {
    label: 'Glass',
    deviceFilter: 'brightness(1.1) saturate(0.8)',
    bodyOverlay: 'linear-gradient(145deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 40%, rgba(200,220,255,0.12) 100%)',
    screenOverlay: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
  },
  frosted: {
    label: 'Frosted',
    deviceFilter: 'brightness(1.05) saturate(0.6) blur(0px)',
    bodyOverlay: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.1) 100%)',
    screenOverlay: 'rgba(255,255,255,0.12)',
  },
  holographic: {
    label: 'Holographic',
    deviceFilter: 'brightness(1.1) saturate(1.4)',
    bodyOverlay: 'linear-gradient(125deg, rgba(255,0,128,0.25) 0%, rgba(0,255,200,0.25) 30%, rgba(100,100,255,0.25) 60%, rgba(255,200,0,0.2) 100%)',
    screenOverlay: 'linear-gradient(125deg, rgba(255,0,128,0.1) 0%, rgba(0,255,200,0.1) 50%, rgba(100,100,255,0.1) 100%)',
  },
  matte: {
    label: 'Matte',
    deviceFilter: 'brightness(0.95) saturate(0.5) contrast(1.05)',
    bodyOverlay: 'transparent',
    screenOverlay: 'transparent',
  },
  neon: {
    label: 'Neon',
    deviceFilter: 'brightness(1.0) saturate(1.2)',
    bodyOverlay: 'transparent',
    screenOverlay: 'transparent',
  },
}

// ── Static lookup tables ───────────────────────────────────────────────────────

export const ANGLE_PRESETS: Record<AnglePreset, Pick<Transform, 'rotX' | 'rotY' | 'rotZ'>> = {
  front:              { rotX: 0,   rotY: 0,   rotZ: 0 },
  'slight-left':      { rotX: -4,  rotY: -22, rotZ: 2 },
  'slight-right':     { rotX: -4,  rotY: 22,  rotZ: -2 },
  'top-down':         { rotX: -78, rotY: 0,   rotZ: 0 },
  'iso-left':         { rotX: -20, rotY: -30, rotZ: 4 },
  'iso-right':        { rotX: -20, rotY: 30,  rotZ: -4 },
  'dramatic-low':     { rotX: 18,  rotY: 20,  rotZ: -3 },
  'floating-quarter': { rotX: -12, rotY: 24,  rotZ: 3 },
}

export const LIGHTING_CONFIGS: Record<LightingPreset, { label: string; brightness: number; contrast: number; shadow: string }> = {
  'soft-studio':       { label: 'Soft Studio',       brightness: 1.05, contrast: 1.02, shadow: '0 40px 80px rgba(0,0,0,0.45)' },
  'bright-product':    { label: 'Bright Product',     brightness: 1.15, contrast: 1.08, shadow: '0 32px 64px rgba(0,0,0,0.3)'  },
  'dark-dramatic':     { label: 'Dark Dramatic',      brightness: 0.85, contrast: 1.2,  shadow: '0 60px 120px rgba(0,0,0,0.75)' },
  'cool-technology':   { label: 'Cool Technology',    brightness: 1.02, contrast: 1.05, shadow: '0 30px 60px rgba(30,80,180,0.25)' },
  'warm-editorial':    { label: 'Warm Editorial',     brightness: 1.08, contrast: 0.98, shadow: '0 40px 80px rgba(60,30,0,0.3)' },
  'minimal-portfolio': { label: 'Minimal Portfolio',  brightness: 1.0,  contrast: 1.0,  shadow: '0 24px 48px rgba(0,0,0,0.25)' },
}

// ── Factory helpers ────────────────────────────────────────────────────────────

export function genId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function defaultTransform(overrides?: Partial<Transform>): Transform {
  return { rotX: -12, rotY: 24, rotZ: 3, posX: 0, posY: 0, scale: 1, ...overrides }
}

export function defaultDevice(type: DeviceType = 'phone'): DeviceConfig {
  return {
    type,
    color: 'space-black',
    orientation: 'portrait',
    showShadow: true,
    showReflection: true,
    screenBrightness: 1,
    materialPreset: 'default',
  }
}

export function defaultTextConfig(): TextConfig {
  return {
    content: 'Your text here',
    fontSize: 48,
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'sans',
    letterSpacing: -0.02,
    lineHeight: 1.2,
    maxWidth: 400,
    align: 'center',
    opacity: 1,
  }
}

export function defaultShapeConfig(shape: ShapeType = 'card'): ShapeConfig {
  return {
    shape,
    color: '#1a1b2e',
    secondaryColor: '#2a2b4e',
    width: 300,
    height: 200,
    borderRadius: 24,
    opacity: 1,
    blur: 0,
    showShadow: true,
  }
}

export function createSceneObject(type: DeviceType, name?: string, transform?: Partial<Transform>): SceneObject {
  return {
    id: genId(),
    name: name ?? `${type.charAt(0).toUpperCase() + type.slice(1)} 1`,
    elementType: 'device',
    device: defaultDevice(type),
    transform: defaultTransform(transform),
    screenshot: null,
    screenshotType: null,
    visible: true,
    locked: false,
  }
}

export function createTextObject(name?: string, transform?: Partial<Transform>): SceneObject {
  return {
    id: genId(),
    name: name ?? 'Text',
    elementType: 'text',
    device: defaultDevice(),
    transform: defaultTransform({ rotX: 0, rotY: 0, rotZ: 0, ...transform }),
    screenshot: null,
    screenshotType: null,
    textConfig: defaultTextConfig(),
    visible: true,
    locked: false,
  }
}

export function createShapeObject(shape: ShapeType, name?: string, transform?: Partial<Transform>): SceneObject {
  return {
    id: genId(),
    name: name ?? shape.charAt(0).toUpperCase() + shape.slice(1),
    elementType: 'shape',
    device: defaultDevice(),
    transform: defaultTransform({ rotX: -8, rotY: 12, rotZ: 0, ...transform }),
    screenshot: null,
    screenshotType: null,
    shapeConfig: defaultShapeConfig(shape),
    visible: true,
    locked: false,
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

export interface Template {
  id: string
  name: string
  description: string
  objects: Omit<SceneObject, 'id'>[]
  background: Partial<Background>
}

export const TEMPLATES: Template[] = [
  {
    id: 'single-phone',
    name: 'Floating Phone',
    description: 'Single phone in dramatic three-quarter view',
    background: { type: 'gradient-linear', gradientFrom: '#0f0c29', gradientTo: '#302b63', gradientAngle: 145 },
    objects: [{ name: 'Phone 1', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -12, rotY: 24, rotZ: 3 }), screenshot: null, screenshotType: null, visible: true, locked: false }],
  },
  {
    id: 'phone-laptop',
    name: 'Phone + Laptop',
    description: 'Classic responsive showcase',
    background: { type: 'solid', color: '#0d1117' },
    objects: [
      { name: 'Laptop 1', elementType: 'device', device: defaultDevice('laptop'), transform: defaultTransform({ rotX: -8, rotY: 18, rotZ: 2, posX: 60, posY: 20, scale: 0.85 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone 1', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -5, rotY: 20, rotZ: 3, posX: -130, posY: 40, scale: 0.9 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
  {
    id: 'three-phone-fan',
    name: 'Three-Phone Fan',
    description: 'Three phones fanned at different angles',
    background: { type: 'gradient-linear', gradientFrom: '#1a1a2e', gradientTo: '#16213e', gradientAngle: 160 },
    objects: [
      { name: 'Phone Left', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -5, rotY: -30, rotZ: -10, posX: -180, posY: 10, scale: 0.8 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone Center', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -8, rotY: 0, rotZ: 0, posX: 0, posY: -10, scale: 0.95 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone Right', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -5, rotY: 30, rotZ: 10, posX: 180, posY: 10, scale: 0.8 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
  {
    id: 'tablet-dashboard',
    name: 'Tablet Dashboard',
    description: 'Landscape tablet in isometric view',
    background: { type: 'solid', color: '#0a0a0f' },
    objects: [{ name: 'Tablet 1', elementType: 'device', device: { ...defaultDevice('tablet'), orientation: 'landscape' }, transform: defaultTransform({ rotX: -22, rotY: 28, rotZ: 4, scale: 1.1 }), screenshot: null, screenshotType: null, visible: true, locked: false }],
  },
  {
    id: 'browser-hero',
    name: 'Browser Hero',
    description: 'Full-width browser with floating phone',
    background: { type: 'gradient-radial', gradientFrom: '#1a1040', gradientTo: '#08080f' },
    objects: [
      { name: 'Browser Window', elementType: 'device', device: defaultDevice('browser'), transform: defaultTransform({ rotX: -10, rotY: 14, rotZ: 2, posX: 40, posY: -10, scale: 0.95 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone 1', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -8, rotY: 22, rotZ: 4, posX: -200, posY: 30, scale: 0.75 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
  {
    id: 'dark-product-hero',
    name: 'Dark Product Hero',
    description: 'Dramatic low-angle shot against dark gradient',
    background: { type: 'gradient-linear', gradientFrom: '#050508', gradientTo: '#0d0d20', gradientAngle: 180 },
    objects: [{ name: 'Phone 1', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: 15, rotY: 22, rotZ: -4, scale: 1.15 }), screenshot: null, screenshotType: null, visible: true, locked: false }],
  },
  {
    id: 'app-store',
    name: 'App Store Spread',
    description: 'Two phones side by side',
    background: { type: 'solid', color: '#f5f5f7' },
    objects: [
      { name: 'Phone Left', elementType: 'device', device: { ...defaultDevice('phone'), color: 'silver' }, transform: defaultTransform({ rotX: -4, rotY: -18, rotZ: -2, posX: -120, posY: 0, scale: 0.92 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone Right', elementType: 'device', device: { ...defaultDevice('phone'), color: 'white' }, transform: defaultTransform({ rotX: -4, rotY: 18, rotZ: 2, posX: 120, posY: 0, scale: 0.92 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
  {
    id: 'responsive-showcase',
    name: 'Responsive Showcase',
    description: 'Phone, tablet, and monitor together',
    background: { type: 'gradient-linear', gradientFrom: '#0a0a14', gradientTo: '#0f0f20', gradientAngle: 135 },
    objects: [
      { name: 'Monitor', elementType: 'device', device: defaultDevice('monitor'), transform: defaultTransform({ rotX: -6, rotY: 12, rotZ: 1, posX: 80, posY: -20, scale: 0.85 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Tablet', elementType: 'device', device: defaultDevice('tablet'), transform: defaultTransform({ rotX: -8, rotY: 18, rotZ: 2, posX: -80, posY: 10, scale: 0.7 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -6, rotY: 24, rotZ: 3, posX: -240, posY: 30, scale: 0.58 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
  {
    id: 'glassmorphism-stack',
    name: 'Glass Stack',
    description: 'Phone with glass card elements in the scene',
    background: { type: 'gradient-radial', gradientFrom: '#1a0a2e', gradientTo: '#0a0814' },
    objects: [
      { name: 'Card Back', elementType: 'shape', device: defaultDevice(), shapeConfig: { shape: 'card', color: 'rgba(120,80,255,0.15)', secondaryColor: 'rgba(80,120,255,0.1)', width: 320, height: 180, borderRadius: 20, opacity: 1, blur: 12, showShadow: true }, transform: defaultTransform({ rotX: -10, rotY: 18, rotZ: -6, posX: 80, posY: -40, scale: 1 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone 1', elementType: 'device', device: { ...defaultDevice('phone'), materialPreset: 'glass' }, transform: defaultTransform({ rotX: -8, rotY: 20, rotZ: 3, posX: -80, posY: 0, scale: 0.95 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
  {
    id: 'text-hero',
    name: 'Text Hero',
    description: 'Phone with bold headline text',
    background: { type: 'gradient-linear', gradientFrom: '#080810', gradientTo: '#12121e', gradientAngle: 160 },
    objects: [
      { name: 'Headline', elementType: 'text', device: defaultDevice(), textConfig: { content: 'Your App.\nReinvented.', fontSize: 52, fontWeight: 700, color: '#ffffff', fontFamily: 'sans', letterSpacing: -0.03, lineHeight: 1.1, maxWidth: 360, align: 'left', opacity: 1 }, transform: defaultTransform({ rotX: 0, rotY: 0, rotZ: 0, posX: -180, posY: -30, scale: 1 }), screenshot: null, screenshotType: null, visible: true, locked: false },
      { name: 'Phone 1', elementType: 'device', device: defaultDevice('phone'), transform: defaultTransform({ rotX: -6, rotY: 24, rotZ: 3, posX: 120, posY: 20, scale: 1 }), screenshot: null, screenshotType: null, visible: true, locked: false },
    ],
  },
]
