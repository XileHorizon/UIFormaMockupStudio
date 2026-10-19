import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import "./tokens/components.css";
import "./button.css";

export type ButtonAppearance = "primary" | "surface" | "secondary" | "tertiary" | "link";
export type ButtonShape = "square" | "rounded";
export type ButtonSize = "compact" | "standard" | "huge";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: ButtonAppearance;
  shape?: ButtonShape;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  contentGap?: number;
  wrapLabel?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  appearance = "primary",
  shape = "square",
  size = "standard",
  leadingIcon,
  trailingIcon,
  loading = false,
  contentGap,
  wrapLabel = true,
  disabled,
  className = "",
  style,
  children,
  ...props
}, ref) {
  const hasText =
    children !== null && children !== undefined && children !== false && children !== "";

  return (
    <button
      ref={ref}
      className={`uf-button uf-button--${appearance} uf-button--${shape} uf-button--${size} ${className}`.trim()}
      style={{ ...style, ...(contentGap === undefined ? {} : { gap: `${contentGap}px` }) }}
      data-icon-only={!hasText || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="uf-button__spinner" aria-hidden="true" /> : leadingIcon}
      {hasText && (wrapLabel ? <span className="uf-button__label">{children}</span> : children)}
      {!loading && trailingIcon}
    </button>
  );
});
