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
    cornerRadius: 0.17,
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

