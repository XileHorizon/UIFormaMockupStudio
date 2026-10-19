import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import "./tokens/components.css";
import "./form-controls.css";

export interface SelectOption { value: string; label: ReactNode; disabled?: boolean }
export interface SelectGroup { label: string; options: readonly SelectOption[] }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: readonly (SelectOption | SelectGroup)[];
  placeholder?: string;
}

function isGroup(option: SelectOption | SelectGroup): option is SelectGroup { return "options" in option; }

export function Select({ label, hint, error, options, placeholder, id: suppliedId, className = "", ...props }: SelectProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <label className={`uf-select ${className}`.trim()} htmlFor={id} data-invalid={error ? true : undefined}>
      {label && <span className="uf-select__label">{label}</span>}
      <span className="uf-select__control">
        <select {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={descriptionId}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => isGroup(option)
            ? <optgroup key={option.label} label={option.label}>{option.options.map((item) => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</optgroup>
            : <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
        <span className="uf-select__chevron" aria-hidden="true">⌄</span>
      </span>
      {(error || hint) && <span id={descriptionId} className="uf-select__description">{error ?? hint}</span>}
    </label>
  );
}
