import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-white/70 px-4 py-3 text-[0.95rem] text-ink",
        "placeholder:text-ink-muted/70",
        "transition-colors focus:border-accent focus:bg-white focus:outline-none",
        /* Só marca erro quando a validação já correu (aria-invalid), não em campos
           vazios — caso contrário o formulário parece falhado antes de o preencher. */
        "aria-[invalid=true]:border-accent aria-[invalid=true]:bg-accent/[0.03]",
        className,
      )}
      {...props}
    />
  );
}
