import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonAppearance, type ButtonSize } from "./Button";
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import "./tokens/components.css";
import "./form-controls.css";

export interface DropdownOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  value: string;
  options: readonly DropdownOption[];
  onValueChange: (value: string) => void;
  label?: ReactNode;
  triggerAppearance?: ButtonAppearance;
  triggerSize?: ButtonSize;
  menuLabel?: ReactNode;
}

export function Dropdown({
  value,
  options,
  onValueChange,
  label,
  triggerAppearance = "surface",
  triggerSize = "standard",
  menuLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="uf-dropdown" ref={rootRef}>
      {label && <span className="uf-dropdown__label">{label}</span>}
      <Button
        ref={triggerRef}
        appearance={triggerAppearance}
        size={triggerSize}
        shape="rounded"
        trailingIcon={open ? <IconChevronDown /> : <IconChevronRight />}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => {
            const target = event.key === "ArrowDown"
              ? optionRefs.current[0]
              : optionRefs.current[optionRefs.current.length - 1];
            target?.focus();
          });
        }}
      >
        {selected?.label}
      </Button>
      {open && (
        <div
          className="uf-dropdown__tray"
          id={menuId}
          role="menu"
          aria-label={typeof menuLabel === "string" ? menuLabel : undefined}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
              return;
            }
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const enabled = optionRefs.current.filter((option) => option && !option.disabled) as HTMLButtonElement[];
            const current = enabled.indexOf(document.activeElement as HTMLButtonElement);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            enabled[(current + direction + enabled.length) % enabled.length]?.focus();
          }}
        >
          {menuLabel && <span className="uf-dropdown__tray-label">{menuLabel}</span>}
          {options.map((option, index) => (
            <Button
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              key={option.value}
              appearance="surface"
              size="standard"
              shape="rounded"
              data-selected={option.value === value || undefined}
              role="menuitemradio"
              aria-checked={option.value === value}
              disabled={option.disabled}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
            >
              <span className="uf-dropdown__option-copy">
                <span>{option.label}</span>
                {option.description && <small>{option.description}</small>}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
