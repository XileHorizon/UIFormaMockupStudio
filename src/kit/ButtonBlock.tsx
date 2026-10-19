import type { ReactNode } from "react";
import { Button } from "./Button";
import "./tokens/components.css";
import "./molecules.css";

export interface ButtonBlockItem<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface ButtonBlockProps<T extends string> {
  items: readonly ButtonBlockItem<T>[];
  value?: T;
  onValueChange?: (value: T) => void;
  label: string;
  className?: string;
}

/** A grid of preset buttons, e.g. lighting presets. The selected preset is marked pressed. */
export function ButtonBlock<T extends string>({ items, value, onValueChange, label, className = "" }: ButtonBlockProps<T>) {
  return (
    <div className={`uf-button-block ${className}`.trim()} role="group" aria-label={label}>
      {items.map((item) => (
        <Button
          key={item.value}
          appearance="surface"
          size="compact"
          aria-pressed={value === undefined ? undefined : value === item.value}
          disabled={item.disabled}
          onClick={() => onValueChange?.(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
