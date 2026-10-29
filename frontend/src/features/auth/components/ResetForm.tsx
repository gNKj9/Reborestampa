"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button";
import { Field } from "@/components/Field";
import { Input } from "@/components/Input";
import { ApiError } from "@/services/api.client";
import { authService } from "@/services/auth.service";

const RULES = [
  { label: "12 caracteres ou mais", test: (value: string) => value.length >= 12 },
  { label: "Uma letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Uma letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Um algarismo", test: (value: string) => /[0-9]/.test(value) },
];

export function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (next !== confirm) {
      setError("A confirmação não coincide com a nova palavra-passe.");
      return;
    }

    if (!RULES.every((rule) => rule.test(next))) {
      setError("A nova palavra-passe ainda não cumpre os requisitos.");
      return;
    }

    setPending(true);
    try {
      await authService.resetPasswordWithToken({ token, newPassword: next });
      setDone(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 400) {
        setError(caught.message);
      } else if (caught instanceof ApiError && caught.status === 403) {
        setError(caught.message);
      } else if (caught instanceof ApiError && caught.status === 422) {
        setError("A palavra-passe não cumpre os requisitos.");
      } else {
        setError("Não foi possível redefinir. Tenta novamente.");
      }
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-white/60 p-6">
        <h1 className="font-display text-[1.6rem] leading-tight">
          Falta o código do link.
        </h1>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-soft">
          Abre o link que recebeste por email ou pede um novo.
        </p>
        <Link
          href="/recuperar"
          className="mt-5 inline-flex text-[0.82rem] font-medium text-ink transition-colors hover:text-accent"
        >
          Pedir novo link →
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-ink-muted">
          Concluído
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.3rem]">
          Palavra-passe alterada.
        </h1>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
          Já podes entrar com a nova palavra-passe. Por segurança, todas as
          sessões abertas foram terminadas.
        </p>

        <ButtonLink href="/login" className="mt-8">
          Entrar na conta
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-ink-muted">
        Área de cliente
      </p>
      <h1 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.3rem]">
        Definir nova palavra-passe.
      </h1>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
        O link é de uso único e expira 30 minutos depois do pedido.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <Field id="new-password" label="Nova palavra-passe">
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          required
        />
      </Field>

      <Field id="confirm-password" label="Confirmar palavra-passe">
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </Field>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {RULES.map((rule) => {
          const met = rule.test(next);
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-2 text-[0.74rem] ${
                met ? "text-emerald-800" : "text-ink-muted"
              }`}
            >
              <span aria-hidden="true">{met ? "✓" : "·"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>

      {error && (
        <div>
          <p role="alert" className="text-[0.84rem] text-accent">
            {error}
          </p>
          <Link
            href="/recuperar"
            className="mt-2 inline-flex text-[0.78rem] text-ink underline decoration-line underline-offset-4 hover:text-accent"
          >
            Pedir um link novo
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A guardar…" : "Guardar nova palavra-passe"}
      </Button>
      </form>
    </>
  );
}
