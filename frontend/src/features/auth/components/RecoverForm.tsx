"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Input } from "@/components/Input";
import { ApiError } from "@/services/api.client";
import { authService } from "@/services/auth.service";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await authService.requestPasswordReset(email.trim());
      setSent(true);
      setDevToken(response.devToken ?? null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        setError(
          "Demasiados pedidos. Aguarda alguns minutos antes de tentar outra vez.",
        );
      } else if (caught instanceof ApiError && caught.status === 422) {
        setError("Indica um email válido.");
      } else {
        setError("Não foi possível enviar o pedido. Tenta novamente.");
      }
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-white/60 p-6">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-ink-muted">
          Pedido recebido
        </p>
        <p className="mt-3 text-[1.05rem] text-ink">
          Se existir uma conta com esse email, o link de recuperação está a
          caminho.
        </p>
        <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">
          O link é válido durante 30 minutos e só pode ser usado uma vez. Se não
          aparecer em alguns minutos, verifica o spam.
        </p>

        {devToken && (
          <p className="mt-4 rounded-lg border border-line bg-paper-deep/60 px-3 py-2 text-[0.78rem] text-ink-soft">
            Ambiente de desenvolvimento:{" "}
            <Link
              href={`/redefinir?token=${encodeURIComponent(devToken)}`}
              className="font-medium text-accent underline decoration-accent/30 underline-offset-4"
            >
              abrir o link de recuperação
            </Link>
            .
          </p>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex text-[0.82rem] font-medium text-ink transition-colors hover:text-accent"
        >
          Voltar ao login →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <Field id="recover-email" label="Email da conta">
        <Input
          id="recover-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="nome@empresa.pt"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </Field>

      {error && (
        <p role="alert" className="text-[0.84rem] text-accent">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A enviar…" : "Enviar link de recuperação"}
      </Button>

      <p className="text-center text-[0.72rem] leading-relaxed text-ink-muted">
        Por segurança, a resposta é a mesma quer o email exista ou não.
      </p>
    </form>
  );
}
