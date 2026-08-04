import { useMemo } from 'react'
import type { TextConfig, Transform } from '../types'

interface Props {
  config: TextConfig
  transform: Transform
}

const FONT_FAMILIES = {
  sans: 'var(--font-sans)',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'var(--font-mono)',
}

export default function TextElement({ config, transform }: Props) {
  const style = useMemo(() => ({
    transform: `rotateX(${transform.rotX}deg) rotateY(${transform.rotY}deg) rotateZ(${transform.rotZ}deg)`,
    transformStyle: 'preserve-3d' as const,
  }), [transform])

  const lines = config.content.split('\n')

  return (
    <div style={style}>
      <div
        style={{
          maxWidth: config.maxWidth,
          fontFamily: FONT_FAMILIES[config.fontFamily],
          fontSize: config.fontSize,
          fontWeight: config.fontWeight,
          color: config.color,
          letterSpacing: `${config.letterSpacing}em`,
          lineHeight: config.lineHeight,
          textAlign: config.align,
          opacity: config.opacity,
          userSelect: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {lines.map((line, i) => (
          <div key={i}>{line || <>&nbsp;</>}</div>
        ))}
      </div>
    </div>
  )
}
