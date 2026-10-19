import type { HTMLAttributes, ReactNode } from "react";
import "./tokens/components.css";
import "./molecules.css";

export interface FieldRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Lays out fields such as Rot X / Rot Y / Rot Z in equal columns. */
export function FieldRow({ children, className = "", ...props }: FieldRowProps) {
  return (
    <div {...props} className={`uf-field-row ${className}`.trim()}>
      {children}
    </div>
  );
}
