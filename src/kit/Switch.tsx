import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconMoonFilled, IconSunFilled } from "@tabler/icons-react";
import "./tokens/components.css";
import "./form-controls.css";

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
}

export function Switch({ checked, onCheckedChange, label, className = "", ...props }: SwitchProps) {
  const control = (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      className={`uf-control-switch ${className}`.trim()}
      data-state={checked ? "checked" : "unchecked"}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange?.(!checked);
      }}
    >
      <span aria-hidden="true" />
    </button>
  );

  if (!label) return control;
  return (
    <label className="uf-control-switch-row">
      {control}
      <span>{label}</span>
    </label>
  );
}


export type ThemeSwitchTheme = "light" | "dark";

export interface ThemeSwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role"> {
  theme: ThemeSwitchTheme;
  onThemeChange?: (theme: ThemeSwitchTheme) => void;
}

export function ThemeSwitch({
  theme,
  onThemeChange,
  className = "",
  "aria-label": ariaLabel = "Dark mode",
  ...props
}: ThemeSwitchProps) {
  const light = theme === "light";
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={!light}
      className={`uf-control-switch uf-control-switch--theme ${className}`.trim()}
      data-state={light ? "unchecked" : "checked"}
      data-theme={theme}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) onThemeChange?.(light ? "dark" : "light");
      }}
    >
      <span aria-hidden="true">{light ? <IconSunFilled /> : <IconMoonFilled />}</span>
    </button>
  );
}
