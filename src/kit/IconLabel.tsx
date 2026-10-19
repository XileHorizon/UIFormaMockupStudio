import type { HTMLAttributes, ReactNode } from "react";
import "./tokens/components.css";
import "./molecules.css";

export interface IconLabelProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
  /** Accessible name for the icon. */
  label: string;
  appearance?: "primary" | "plain";
  size?: "standard" | "large";
}

/** A 54px icon tile, filled (primary) or bare (plain). */
export function IconLabel({ icon, label, appearance = "primary", size = "standard", className = "", ...props }: IconLabelProps) {
  return (
    <span
      {...props}
      role="img"
      aria-label={label}
      className={`uf-icon-label uf-icon-label--${appearance} uf-icon-label--${size} ${className}`.trim()}
    >
      {icon}
    </span>
  );
}
