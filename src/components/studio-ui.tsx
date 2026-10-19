import { useEffect, useState, type ReactNode } from 'react'
import { SettingsSection, Switch, TextField } from '../kit'

// Small Studio compositions of Kit components. Layout only; all colour and type comes from Kit tokens.

export function Section({ title, open, onOpenChange, spacing = 'standard', children }: { title: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; spacing?: 'standard' | 'tight' | 'compact'; children: ReactNode }) {
  return <SettingsSection className="studio-section" title={title} open={open} onOpenChange={onOpenChange} spacing={spacing}>{children}</SettingsSection>
}

export function PropRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="studio-prop-row">
      <span className="studio-prop-row__label">{label}</span>
      <div className="studio-prop-row__control">{children}</div>
    </div>
  )
}

export function SwitchRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <PropRow label={label}><Switch aria-label={label} checked={checked} onCheckedChange={onCheckedChange} /></PropRow>
}

const HEX = /^#[0-9a-f]{6}$/i

/** Colour chip that opens the native picker, next to an editable hex field. */
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const isHex = HEX.test(value)
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <PropRow label={label}>
      <div className="studio-color-field">
        <label className="studio-color-field__chip" style={{ background: value }}>
          <input type="color" aria-label={`${label} colour`} value={isHex ? value : '#ffffff'} onChange={event => onChange(event.currentTarget.value)} />
        </label>
        <TextField
          size="slim"
          aria-label={`${label} hex`}
          value={isHex ? draft.toUpperCase() : draft}
          spellCheck={false}
          onChange={event => {
            const next = event.currentTarget.value.trim()
            setDraft(next)
            if (HEX.test(next)) onChange(next)
          }}
          onBlur={() => setDraft(value)}
        />
      </div>
    </PropRow>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="studio-hint">{children}</p>
}
