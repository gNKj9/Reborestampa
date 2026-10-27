import { cn } from "@/utils/cn";

type LogoProps = {
  className?: string;
  compact?: boolean;
  /** Em fundos escuros a marca vai num disco de papel, como um carimbo. */
  onDark?: boolean;
};

/**
 * Marca: o símbolo oficial (círculo com o R e os salpicos) + o nome composto
 * com a tipografia do site, legível em qualquer tamanho.
 *
 * O lockup completo do logotipo (com a assinatura "ESTAMPARIA TÊXTIL") é usado
 * no rodapé, onde há espaço para a versão vertical.
 */
export function Logo({ className, compact = false, onDark = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center",
          onDark ? "h-12 w-12 rounded-full bg-paper p-1.5" : "h-10 w-10",
        )}
      >
        <img
          src="/brand/mark-192.webp"
          alt=""
          width={40}
          height={40}
          className={cn("object-contain", onDark ? "h-9 w-9" : "h-10 w-10")}
          decoding="async"
        />
      </span>

      <span className="flex min-w-0 flex-col leading-none">
        <span className="whitespace-nowrap text-[0.82rem] font-semibold uppercase tracking-[0.18em] sm:text-[0.95rem] sm:tracking-[0.26em]">
          Reborestampa
        </span>
        {!compact && (
          <span className="mt-1.5 hidden text-[0.6rem] uppercase tracking-[0.26em] opacity-70 sm:block">
            Estamparia têxtil
          </span>
        )}
      </span>
    </span>
  );
}
