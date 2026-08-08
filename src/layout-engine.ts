import * as THREE from 'three'
import type { AppState, LayoutModifier, MirrorLayoutSettings, PatternAxis, RadialLayoutSettings, SceneObject, Transform } from './types'

export interface EvaluatedObject extends SceneObject {
  generated?: boolean
  sourceId?: string
  generatedBy?: string
  instanceKey?: string
}

const position = (t: Transform) => new THREE.Vector3(t.posX, t.posY, t.posZ)
const rotation = (t: Transform) => new THREE.Quaternion().setFromEuler(new THREE.Euler(
  THREE.MathUtils.degToRad(t.rotX), THREE.MathUtils.degToRad(t.rotY), THREE.MathUtils.degToRad(t.rotZ), 'XYZ'))

function toTransform(p: THREE.Vector3, q: THREE.Quaternion, input: Transform): Transform {
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ')
  return { ...input, posX: p.x, posY: p.y, posZ: p.z, rotX: THREE.MathUtils.radToDeg(e.x), rotY: THREE.MathUtils.radToDeg(e.y), rotZ: THREE.MathUtils.radToDeg(e.z) }
}

function axisVector(axis: PatternAxis) {
  return axis === 'x' ? new THREE.Vector3(1, 0, 0) : axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
}

function radialTransforms(input: Transform, settings: RadialLayoutSettings): Transform[] {
  const count = Math.max(1, Math.min(256, Math.round(settings.count)))
  // A constant-radius pattern cannot represent spans beyond one revolution
  // without later instances lapping earlier ones and appearing to swap order.
  // Start angle remains unrestricted so the whole pattern can still rotate
  // through multiple revolutions without changing instance identity.
  const angle = THREE.MathUtils.clamp(settings.angle, -360, 360)
  const pivot = new THREE.Vector3(settings.pivot.x, settings.pivot.y, settings.pivot.z)
  const relative = position(input).sub(pivot)
  const radial = relative.clone().sub(axisVector(settings.axis).multiplyScalar(relative.dot(axisVector(settings.axis))))
  if (settings.radiusOffset) relative.add(radial.lengthSq() ? radial.normalize().multiplyScalar(settings.radiusOffset) : new THREE.Vector3())
  // A closed revolution must not include the endpoint twice. Use a smooth
  // blend near complete revolutions so stepping 359 <-> 360 cannot make the
  // last instance jump between opposite ends of the pattern.
  const revolutions = Math.max(1, Math.round(Math.abs(angle) / 360))
  const closedAngle = revolutions * 360
  const closeness = Math.max(0, 1 - Math.abs(Math.abs(angle) - closedAngle) / 10)
  const divisor = Math.max(1, (count - 1) + closeness)
  return Array.from({ length: count }, (_, index) => {
    const degrees = settings.startAngle + settings.direction * angle * index / divisor
    const q = new THREE.Quaternion().setFromAxisAngle(axisVector(settings.axis), THREE.MathUtils.degToRad(degrees))
    const p = relative.clone().applyQuaternion(q).add(pivot)
    const r = settings.orientation === 'follow' ? q.multiply(rotation(input)) : rotation(input)
    return toTransform(p, r, input)
  })
}

function reflectedTransform(input: Transform, axes: PatternAxis[], pivotValue: { x: number; y: number; z: number }): Transform {
  const p = position(input)
  const e = new THREE.Euler().setFromQuaternion(rotation(input), 'XYZ')
  for (const axis of axes) {
    const key = axis as 'x' | 'y' | 'z'
    p[key] = 2 * pivotValue[key] - p[key]
    // Reflection changes handedness. With uiForma's Euler-only transform model,
    // negating the two rotations in the reflection plane is the stable visual equivalent.
    if (axis === 'x') { e.y *= -1; e.z *= -1 }
    if (axis === 'y') { e.x *= -1; e.z *= -1 }
    if (axis === 'z') { e.x *= -1; e.y *= -1 }
  }
  return {
    ...input,
    posX: p.x, posY: p.y, posZ: p.z,
    rotX: THREE.MathUtils.radToDeg(e.x), rotY: THREE.MathUtils.radToDeg(e.y), rotZ: THREE.MathUtils.radToDeg(e.z),
    scaleX: (input.scaleX ?? 1) * (axes.includes('x') ? -1 : 1),
    scaleY: (input.scaleY ?? 1) * (axes.includes('y') ? -1 : 1),
    scaleZ: (input.scaleZ ?? 1) * (axes.includes('z') ? -1 : 1),
  }
}

function mirrorTransforms(input: Transform, settings: MirrorLayoutSettings): Transform[] {
  const axes = settings.axes
  return Array.from({ length: 1 << axes.length }, (_, mask) => {
    const enabled = axes.filter((_, index) => mask & (1 << index))
    return reflectedTransform(input, enabled, settings.pivot)
  })
}

export function evaluateLayout(transform: Transform, modifier: LayoutModifier): Transform[] {
  if (!modifier.enabled) return [transform]
  return modifier.type === 'radial'
    ? radialTransforms(transform, modifier.settings as RadialLayoutSettings)
    : mirrorTransforms(transform, modifier.settings as MirrorLayoutSettings)
}

export function evaluateScene(state: AppState): EvaluatedObject[] {
  const layouts = state.layouts ?? []
  const result: EvaluatedObject[] = []
  for (const source of state.objects) {
    let instances: EvaluatedObject[] = [{ ...source, sourceId: source.id, instanceKey: 'source' }]
    for (const layout of layouts) {
      if (!layout.enabled || !layout.sourceIds.includes(source.id)) continue
      instances = instances.flatMap((instance, inputIndex) => evaluateLayout(instance.transform, layout).map((transform, outputIndex) => {
        const instanceKey = `${instance.instanceKey}.${layout.id}:${outputIndex}`
        const override = layout.instanceOverrides[instanceKey]
        return {
          ...instance,
          id: outputIndex === 0 && !instance.generated ? source.id : `instance:${source.id}:${instanceKey}`,
          name: outputIndex === 0 && !instance.generated ? source.name : `${source.name} · ${layout.type} ${outputIndex + 1}`,
          transform,
          generated: outputIndex !== 0 || instance.generated,
          generatedBy: layout.id,
          sourceId: source.id,
          instanceKey,
          device: { ...instance.device, ...override?.device },
          textConfig: instance.textConfig ? { ...instance.textConfig, ...override?.textConfig } : undefined,
          shapeConfig: instance.shapeConfig ? { ...instance.shapeConfig, ...override?.shapeConfig } : undefined,
          linkedIndex: inputIndex,
        }
      }))
    }
    result.push(...instances)
  }
  return result
}

export function selectionCenter(objects: SceneObject[]) {
  if (!objects.length) return { x: 0, y: 0, z: 0 }
  return objects.reduce((p, object) => ({ x: p.x + object.transform.posX / objects.length, y: p.y + object.transform.posY / objects.length, z: p.z + object.transform.posZ / objects.length }), { x: 0, y: 0, z: 0 })
}
