import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import "./tokens/components.css";
import "./molecules.css";

export interface SettingsSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  children: ReactNode;
  /** Controlled open state; omit for an uncontrolled section. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Row spacing: standard (Lighting), tight (Transform), or compact (Colors) in Figma. */
  spacing?: "standard" | "tight" | "compact";
}

export function SettingsSection({
  title,
  children,
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  spacing = "standard",
  className = "",
  ...props
}: SettingsSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const bodyId = useId();
  const toggle = () => {
    if (controlledOpen === undefined) setInternalOpen(!open);
    onOpenChange?.(!open);
  };
  return (
    <section {...props} className={`uf-settings-section ${className}`.trim()} data-spacing={spacing}>
      <h3 className="uf-settings-section__header">
        <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={toggle}>
          <span>{title}</span>
          {open ? <IconChevronDown aria-hidden="true" /> : <IconChevronRight aria-hidden="true" />}
        </button>
      </h3>
      <div className="uf-settings-section__body" id={bodyId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
