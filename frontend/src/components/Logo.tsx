import { cn } from "@/utils/cn";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

/**
 * Marca: monograma numa moldura de carimbo + wordmark.
 * Herda a cor do texto, para funcionar em fundo claro e escuro.
 */
export function Logo({ className, compact = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="32"
          height="32"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <rect
          x="5.5"
          y="5.5"
          width="23"
          height="23"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.45"
        />
        <path
          d="M11.6 24.4V9.8h6.5c3 0 5 1.7 5 4.3 0 1.9-1.1 3.3-2.8 3.9l3.3 6.4h-3.4l-2.8-5.7h-2.5v5.7h-3.3Zm3.3-8.2h2.8c1.4 0 2.1-.7 2.1-1.9s-.7-1.9-2.1-1.9h-2.8v3.8Z"
          fill="currentColor"
        />
      </svg>

      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-semibold uppercase tracking-[0.26em]">
          Reborestampa
        </span>
        {!compact && (
          <span className="mt-1.5 text-[0.54rem] uppercase tracking-[0.32em] opacity-60">
            Estamparia têxtil
          </span>
        )}
      </span>
    </span>
  );
}
