export interface DeviceScreenGeometry {
  width: number
  height: number
  centerX: number
  centerY: number
  frontZ: number
  cornerRadius: number
  islandWidth: number
  islandHeight: number
  islandCenterX: number
  islandCenterY: number
}

export type ScreenFitMode = 'fill' | 'fit' | 'stretch' | 'custom'

export interface ScreenUvPlacement {
  repeatX: number
  repeatY: number
  offsetX: number
  offsetY: number
  rotation: number
}

/** Maps screen UVs into source-image UVs without changing the source pixels. */
export function screenUvPlacement({
  imageAspect,
  screenAspect,
  mode,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  rotation = 0,
}: {
  imageAspect: number
  screenAspect: number
  mode: ScreenFitMode
  scale?: number
  offsetX?: number
  offsetY?: number
  rotation?: number
}): ScreenUvPlacement {
  const normalizedRotation = ((rotation % 360) + 360) % 360
  const quarterTurn = normalizedRotation === 90 || normalizedRotation === 270
  const effectiveImageAspect = quarterTurn ? 1 / imageAspect : imageAspect
  let repeatX = 1
  let repeatY = 1

  if (mode === 'fill') {
    if (effectiveImageAspect > screenAspect) repeatX = screenAspect / effectiveImageAspect
    else repeatY = effectiveImageAspect / screenAspect
  } else if (mode === 'fit' || mode === 'custom') {
    if (effectiveImageAspect > screenAspect) repeatY = effectiveImageAspect / screenAspect
    else repeatX = screenAspect / effectiveImageAspect
  }

  const zoom = Math.max(0.25, Math.min(4, scale))
  repeatX /= zoom
  repeatY /= zoom

  return {
    repeatX,
    repeatY,
    // The texture transform already scales around its centre (texture.center
    // = 0.5), so the offset is only the pan. Positive moves the image right/up.
    offsetX: 0 - (Math.max(-100, Math.min(100, offsetX)) / 200) * repeatX + 0,
    offsetY: 0 - (Math.max(-100, Math.min(100, offsetY)) / 200) * repeatY + 0,
    rotation: normalizedRotation * Math.PI / 180,
  }
}

interface Bounds3 {
  min: readonly [number, number, number]
  max: readonly [number, number, number]
}

export function normalizedScreenGeometry(
  modelBounds: Bounds3,
  displayBounds: Bounds3,
  targetHeight: number,
): DeviceScreenGeometry {
  const modelHeight = modelBounds.max[1] - modelBounds.min[1]
  const scale = targetHeight / modelHeight
  const modelCenter = modelBounds.min.map((value, index) => (value + modelBounds.max[index]) / 2)
  const displayCenter = displayBounds.min.map((value, index) => (value + displayBounds.max[index]) / 2)
  return {
    width: (displayBounds.max[0] - displayBounds.min[0]) * scale,
    height: (displayBounds.max[1] - displayBounds.min[1]) * scale,
    centerX: (displayCenter[0] - modelCenter[0]) * scale,
    centerY: (displayCenter[1] - modelCenter[1]) * scale,
    frontZ: (displayBounds.max[2] - modelCenter[2]) * scale,
    // Outer shell radius minus the measured 0.06-unit bezel inset. Keeping
    // these arcs concentric avoids the heavy dark wedges at the top corners.
    cornerRadius: 0.24,
    islandWidth: 0.654,
    islandHeight: 0.186,
    islandCenterX: -0.019,
    islandCenterY: 1.986,
  }
}

// Measured from the OBJ's model and Display material groups. Keeping the raw
// bounds here makes asset replacement/calibration reviewable and reproducible.
export const IPHONE_17_PRO_SCREEN = normalizedScreenGeometry(
  { min: [-0.7599499822, 0.5926139951, -0.146239996], max: [1.2065080404, 4.6357078552, 0.2166450024] },
  { min: [-0.710390985, 0.6585649848, 0.1960240006], max: [1.1553260088, 4.5724210739, 0.2166450024] },
  4.4,
)

