import { useMemo } from 'react'
import type { ShapeConfig, Transform } from '../types'

interface Props {
  config: ShapeConfig
  transform: Transform
}

function CardShape({ c }: { c: ShapeConfig }) {
  const shadow = c.showShadow ? `0 20px 60px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)` : 'none'
  return (
    <div
      style={{
        width: c.width,
        height: c.height,
        borderRadius: c.borderRadius,
        background: c.blur > 0
          ? `${c.color}`
          : `linear-gradient(145deg, ${c.color}, ${c.secondaryColor})`,
        backdropFilter: c.blur > 0 ? `blur(${c.blur}px)` : 'none',
        WebkitBackdropFilter: c.blur > 0 ? `blur(${c.blur}px)` : 'none',
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: c.opacity,
        boxShadow: shadow,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Inner shine */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 40%)', borderRadius: c.borderRadius, pointerEvents: 'none' }} />
    </div>
  )
}

function RingShape({ c }: { c: ShapeConfig }) {
  const size = Math.max(c.width, c.height)
  const thickness = Math.max(8, size * 0.12)
  const shadow = c.showShadow ? `0 0 40px rgba(0,0,0,0.4)` : 'none'
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${thickness}px solid transparent`,
        backgroundImage: `linear-gradient(#000, #000), linear-gradient(135deg, ${c.color}, ${c.secondaryColor})`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        opacity: c.opacity,
        boxShadow: shadow,
        filter: c.blur > 0 ? `blur(${c.blur}px)` : 'none',
      }}
    />
  )
}

function BlobShape({ c }: { c: ShapeConfig }) {
  const shadow = c.showShadow ? `0 20px 80px rgba(0,0,0,0.5)` : 'none'
  return (
    <div
      style={{
        width: c.width,
        height: c.height,
        borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
        background: `radial-gradient(ellipse at 40% 40%, ${c.color}, ${c.secondaryColor})`,
        opacity: c.opacity,
        filter: c.blur > 0 ? `blur(${c.blur}px)` : 'none',
        boxShadow: shadow,
      }}
    />
  )
}

function PedestalShape({ c }: { c: ShapeConfig }) {
  const shadow = c.showShadow ? `0 16px 40px rgba(0,0,0,0.5)` : 'none'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: c.opacity, filter: c.blur > 0 ? `blur(${c.blur}px)` : 'none' }}>
      {/* Column */}
      <div style={{ width: c.width * 0.35, height: c.height * 0.65, background: `linear-gradient(90deg, ${c.secondaryColor} 0%, ${c.color} 40%, ${c.color} 60%, ${c.secondaryColor} 100%)`, borderRadius: '4px 4px 0 0', boxShadow: shadow }} />
      {/* Capital */}
      <div style={{ width: c.width * 0.5, height: c.height * 0.1, background: `linear-gradient(90deg, ${c.secondaryColor} 0%, ${c.color} 50%, ${c.secondaryColor} 100%)`, borderRadius: 4 }} />
      {/* Base */}
      <div style={{ width: c.width, height: c.height * 0.12, background: `linear-gradient(90deg, ${c.secondaryColor} 0%, ${c.color} 50%, ${c.secondaryColor} 100%)`, borderRadius: `0 0 ${c.borderRadius}px ${c.borderRadius}px` }} />
    </div>
  )
}

function PlaneShape({ c }: { c: ShapeConfig }) {
  const shadow = c.showShadow ? `0 8px 32px rgba(0,0,0,0.4)` : 'none'
  return (
    <div
      style={{
        width: c.width,
        height: c.height,
        borderRadius: c.borderRadius,
        background: `linear-gradient(180deg, ${c.color} 0%, ${c.secondaryColor} 100%)`,
        opacity: c.opacity,
        boxShadow: shadow,
        filter: c.blur > 0 ? `blur(${c.blur}px)` : 'none',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
  )
}

export default function ShapeElement({ config, transform }: Props) {
  const style = useMemo(() => ({
    transform: `rotateX(${transform.rotX}deg) rotateY(${transform.rotY}deg) rotateZ(${transform.rotZ}deg)`,
    transformStyle: 'preserve-3d' as const,
  }), [transform])

  return (
    <div style={style}>
      {config.shape === 'card'     && <CardShape c={config} />}
      {config.shape === 'ring'     && <RingShape c={config} />}
      {config.shape === 'blob'     && <BlobShape c={config} />}
      {config.shape === 'pedestal' && <PedestalShape c={config} />}
      {config.shape === 'plane'    && <PlaneShape c={config} />}
    </div>
  )
}
