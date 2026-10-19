import type { ReactNode } from "react";
import { TextField, type TextFieldProps } from "./TextField";

export interface NumberFieldProps extends Omit<TextFieldProps, "type" | "leadingIcon" | "trailingIcon" | "prefix"> {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function NumberField({ prefix, suffix, inputMode = "decimal", ...props }: NumberFieldProps) {
  return <TextField {...props} type="number" inputMode={inputMode} leadingIcon={prefix} trailingIcon={suffix} />;
}
