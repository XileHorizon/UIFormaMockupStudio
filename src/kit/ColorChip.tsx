import type { CSSProperties, HTMLAttributes } from "react";
import "./tokens/components.css";
import "./color-chip.css";

export type ColorChipSize = "large" | "medium" | "wide" | "small";

const defaultColors: Record<ColorChipSize, string> = {
  large: "#412ec2",
  medium: "#3c3e46",
  wide: "#3c3e46",
  small: "#4e545c",
};

export interface ColorChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  size?: ColorChipSize;
  color?: string;
}

export function ColorChip({
  size = "large",
  color = defaultColors[size],
  className = "",
  style,
  ...props
}: ColorChipProps) {
  return (
    <span
      className={`uf-color-chip uf-color-chip--${size} ${className}`.trim()}
      style={{ "--uf-chip-color": color, ...style } as CSSProperties}
      {...props}
    />
  );
}
