"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-[0.66rem] uppercase tracking-[0.26em] text-ink-muted">
          Erro inesperado
        </p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight">
          Algo falhou a carregar esta página.
        </h1>
        <p className="mt-3 text-[0.88rem] text-ink-soft">
          Tenta novamente. Se persistir, contacta o administrador da plataforma.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Tentar novamente
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-[0.7rem] text-ink-muted">Ref.: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
