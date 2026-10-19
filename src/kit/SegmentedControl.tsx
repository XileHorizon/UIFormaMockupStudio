import type { ReactNode } from "react";
import "./tokens/components.css";
import "./form-controls.css";

export interface SegmentedItem<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  items: readonly SegmentedItem<T>[];
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  items,
  onValueChange,
  label,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`uf-segmented-control ${className}`.trim()} role="radiogroup" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="radio"
          aria-checked={value === item.value}
          disabled={item.disabled}
          data-state={value === item.value ? "checked" : "unchecked"}
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

