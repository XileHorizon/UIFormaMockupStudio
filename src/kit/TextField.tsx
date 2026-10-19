import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import "./tokens/components.css";
import "./form-controls.css";

export type TextFieldSize = "slim" | "standard";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Inline secondary text shown after the value, e.g. a unit or format hint. */
  supportingText?: ReactNode;
  size?: TextFieldSize;
  hint?: ReactNode;
  error?: ReactNode;
}

export function TextField({
  label,
  leadingIcon,
  trailingIcon,
  supportingText,
  size = "standard",
  hint,
  error,
  id: suppliedId,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <label
      className={`uf-text-field uf-text-field--${size} ${className}`.trim()}
      htmlFor={id}
      data-invalid={error ? true : undefined}
    >
      {label && <span className="uf-text-field__label">{label}</span>}
      <span className="uf-text-field__control">
        {leadingIcon && <span className="uf-text-field__icon">{leadingIcon}</span>}
        <input {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={descriptionId} />
        {supportingText && <span className="uf-text-field__supporting">{supportingText}</span>}
        {trailingIcon && <span className="uf-text-field__icon">{trailingIcon}</span>}
      </span>
      {(error || hint) && (
        <span id={descriptionId} className="uf-text-field__description">
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

export function TextArea({ label, hint, error, id: suppliedId, className = "", ...props }: TextAreaProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <label className={`uf-text-field uf-text-field--tall ${className}`.trim()} htmlFor={id} data-invalid={error ? true : undefined}>
      {label && <span className="uf-text-field__label">{label}</span>}
      <span className="uf-text-field__control">
        <textarea {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={descriptionId} />
      </span>
      {(error || hint) && (
        <span id={descriptionId} className="uf-text-field__description">
          {error ?? hint}
        </span>
      )}
    </label>
  );
}
