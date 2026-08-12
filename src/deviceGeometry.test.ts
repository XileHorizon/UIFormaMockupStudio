import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IPHONE_17_PRO_SCREEN, normalizedScreenGeometry } from './deviceGeometry.ts'

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
      cornerRadius: 0.17, islandWidth: 0.654, islandHeight: 0.186,
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
