import { useId, type ReactNode } from "react";
import { Slider } from "./Slider";
import "./tokens/components.css";
import "./molecules.css";

export interface SidebarSliderProps {
  label: ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Formats the readout; defaults to one decimal place. */
  formatValue?: (value: number) => ReactNode;
  className?: string;
}

/** A compact inline slider row: label, compact slider, and value readout. */
export function SidebarSlider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.1,
  formatValue = (current) => current.toFixed(1),
  className = "",
}: SidebarSliderProps) {
  const id = useId();
  return (
    <div className={`uf-sidebar-slider ${className}`.trim()}>
      <label className="uf-sidebar-slider__label" htmlFor={id}>
        {label}
      </label>
      <Slider
        id={id}
        className="uf-sidebar-slider__control"
        size="compact"
        showValue={false}
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
      />
      <output className="uf-sidebar-slider__value" htmlFor={id}>
        {formatValue(value)}
      </output>
    </div>
  );
}
