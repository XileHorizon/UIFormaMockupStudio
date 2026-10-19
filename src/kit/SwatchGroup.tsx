import { useId, type ReactNode } from "react";
import { ColorChip } from "./ColorChip";
import "./tokens/components.css";
import "./molecules.css";

export interface SwatchGroupProps {
  label: ReactNode;
  /** Swatch colours; omit for a custom-colour group with only the picker swatch. */
  colors?: readonly string[];
  value?: string;
  onValueChange?: (color: string) => void;
  /** Adds a rainbow swatch that opens the native colour picker. */
  custom?: boolean;
  className?: string;
}

export function SwatchGroup({ label, colors = [], value, onValueChange, custom = false, className = "" }: SwatchGroupProps) {
  const labelId = useId();
  return (
    <div className={`uf-swatch-group ${className}`.trim()} role="group" aria-labelledby={labelId}>
      <span className="uf-swatch-group__label" id={labelId}>
        {label}
      </span>
      <div className="uf-swatch-group__swatches">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className="uf-swatch-group__swatch"
            aria-label={color}
            aria-pressed={value === undefined ? undefined : value.toLowerCase() === color.toLowerCase()}
            onClick={() => onValueChange?.(color)}
          >
            <ColorChip size="small" color={color} />
          </button>
        ))}
        {custom && (
          <label className="uf-swatch-group__swatch uf-swatch-group__custom">
            <span aria-hidden="true" />
            <input
              type="color"
              aria-label="Custom color"
              value={value ?? "#000000"}
              onChange={(event) => onValueChange?.(event.currentTarget.value)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
