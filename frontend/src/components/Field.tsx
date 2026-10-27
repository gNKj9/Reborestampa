import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink-soft"
        >
          {label}
        </label>
        {hint && <span className="text-[0.7rem] text-ink-muted">{hint}</span>}
      </div>

      {children}

      {error && (
        <p role="alert" className="text-[0.78rem] text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
