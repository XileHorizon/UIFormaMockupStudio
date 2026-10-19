import { useId, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import "./tokens/components.css";
import "./form-controls.css";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "size"> {
  label?: ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  showValue?: boolean;
  gradient?: string;
  size?: "standard" | "compact";
}

export function Slider({
  label,
  value,
  onValueChange,
  showValue = true,
  gradient,
  size = "standard",
  id: suppliedId,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  ...props
}: SliderProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const minimum = Number(min);
  const maximum = Number(max);
  // Match the browser, which snaps the thumb to the step grid, so the fill ends under the thumb.
  const stepSize = Number(step);
  const snapped = stepSize > 0 ? minimum + Math.round((value - minimum) / stepSize) * stepSize : value;
  const percentage = ((Math.min(maximum, Math.max(minimum, snapped)) - minimum) / (maximum - minimum)) * 100;
  return (
    <label
      className={`uf-slider uf-slider--${size} ${className}`.trim()}
      htmlFor={id}
      data-gradient={gradient ? true : undefined}
    >
      {(label || showValue) && (
        <span className="uf-slider__heading">
          <span>{label}</span>
          {showValue && <output htmlFor={id}>{value}</output>}
        </span>
      )}
      <input
        {...props}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onValueChange(Number(event.currentTarget.value))}
        style={{
          "--uf-slider-progress": `${percentage}%`,
          ...(gradient ? { "--uf-slider-gradient": gradient } : {}),
        } as CSSProperties}
      />
    </label>
  );
}

