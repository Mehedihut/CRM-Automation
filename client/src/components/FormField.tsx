import type { ReactNode } from "react";

interface Props {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, hint, children }: Props) {
  return (
    <div className="form-row">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && (
        <span className="muted" style={{ fontSize: 12 }}>
          {hint}
        </span>
      )}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
