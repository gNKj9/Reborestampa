import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.28em] text-ink-muted">
      <span className="h-1 w-1 rounded-full bg-accent" />
      {children}
    </span>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-ink-soft">
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white/60 p-6 shadow-[0_1px_0_0_rgba(23,20,15,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
