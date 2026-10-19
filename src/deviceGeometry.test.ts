import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IPHONE_17_PRO_SCREEN, normalizedScreenGeometry, screenUvPlacement } from './deviceGeometry.ts'

function closeTo(actual: number, expected: number, tolerance = 0.001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`)
}

describe('device screen geometry', () => {
  it('normalizes display bounds around the model center', () => {
    assert.deepEqual(normalizedScreenGeometry(
      { min: [-1, 0, -0.2], max: [1, 4, 0.2] },
      { min: [-0.8, 0.2, 0.1], max: [0.8, 3.8, 0.2] },
      8,
    ), {
      width: 3.2, height: 7.199999999999999, centerX: 0, centerY: 0, frontZ: 0.4,
      cornerRadius: 0.24, islandWidth: 0.654, islandHeight: 0.186,
      islandCenterX: -0.019, islandCenterY: 1.986,
    })
  })

  it('matches the iPhone OBJ Display material measurements', () => {
    closeTo(IPHONE_17_PRO_SCREEN.width, 2.0306)
    closeTo(IPHONE_17_PRO_SCREEN.height, 4.2594)
    closeTo(IPHONE_17_PRO_SCREEN.centerX, -0.00088)
    closeTo(IPHONE_17_PRO_SCREEN.centerY, 0.00145)
    closeTo(IPHONE_17_PRO_SCREEN.frontZ, 0.19746)
  })
})

describe('screen UV placement', () => {
  it('covers without distortion and centers the crop', () => {
    const placement = screenUvPlacement({ imageAspect: 16 / 9, screenAspect: 9 / 16, mode: 'fill' })
    closeTo(placement.repeatX, 81 / 256)
    closeTo(placement.repeatY, 1)
    closeTo(placement.offsetX, 0)
    closeTo(placement.offsetY, 0)
  })

  it('contains the full image with letterbox UVs', () => {
    const placement = screenUvPlacement({ imageAspect: 16 / 9, screenAspect: 9 / 16, mode: 'fit' })
    closeTo(placement.repeatX, 1)
    closeTo(placement.repeatY, 256 / 81)
    closeTo(placement.offsetY, 0)
  })

  it('supports stretch, zoom, pan, and quarter-turn rotation', () => {
    const stretch = screenUvPlacement({ imageAspect: 2, screenAspect: 1, mode: 'stretch' })
    assert.deepEqual(stretch, { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0, rotation: 0 })

    const custom = screenUvPlacement({ imageAspect: 2, screenAspect: 1, mode: 'custom', scale: 2, offsetX: 20, offsetY: -10, rotation: 90 })
    closeTo(custom.repeatX, 1)
    closeTo(custom.repeatY, 0.5)
    closeTo(custom.offsetX, -0.1)
    closeTo(custom.offsetY, 0.025)
    closeTo(custom.rotation, Math.PI / 2)
  })
})
