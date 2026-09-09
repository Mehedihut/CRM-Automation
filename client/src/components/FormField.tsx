import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function FormField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: Props): JSX.Element {
  const inputId = id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} className={className} {...rest} />
      {hint && !error ? <div className="hint">{hint}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
