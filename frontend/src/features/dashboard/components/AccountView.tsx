"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Input } from "@/components/Input";
import { Badge, Card, Container, Eyebrow } from "@/components/Surface";
import { useAuth } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/features/auth/roles";
import { ApiError, refreshSession } from "@/services/api.client";
import { authService } from "@/services/auth.service";
import { formatDate } from "@/utils/format";

const RULES = [
  { label: "12 caracteres ou mais", test: (value: string) => value.length >= 12 },
  { label: "Uma letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Uma letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Um algarismo", test: (value: string) => /[0-9]/.test(value) },
];

export function AccountView() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDone(false);

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
      await authService.changePassword({
        currentPassword: current,
        newPassword: next,
      });

      // A mudança invalida o access token atual: renova já, em vez de deixar
      // o próximo pedido apanhar um 401.
      await refreshSession();

      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível alterar a palavra-passe.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;

  return (
    <Container className="space-y-8">
      <div>
        <Eyebrow>Conta</Eyebrow>
        <h1 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.5rem]">
          A tua conta
        </h1>
        <p className="mt-2 max-w-[58ch] text-[0.88rem] text-ink-soft">
          Dados de acesso e alteração da palavra-passe. Ao mudar a palavra-passe,
          as outras sessões abertas noutros dispositivos terminam.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
              Identificação
            </h2>
            <Badge>{ROLE_LABELS[user.role]}</Badge>
          </div>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                Nome
              </dt>
              <dd className="mt-1 text-[0.9rem]">{user.name}</dd>
            </div>
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                Email
              </dt>
              <dd className="mt-1 text-[0.9rem]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                Último acesso
              </dt>
              <dd className="mt-1 text-[0.9rem]">{formatDate(user.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                Palavra-passe alterada
              </dt>
              <dd className="mt-1 text-[0.9rem]">
                {formatDate(user.passwordChangedAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
            Alterar palavra-passe
          </h2>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <Field id="current-password" label="Palavra-passe atual">
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </Field>

            <Field id="new-password-own" label="Nova palavra-passe">
              <Input
                id="new-password-own"
                type="password"
                autoComplete="new-password"
                required
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </Field>

            <Field id="confirm-password" label="Confirmar nova palavra-passe">
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
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
              <p role="alert" className="text-[0.82rem] text-accent">
                {error}
              </p>
            )}

            {done && (
              <p role="status" className="text-[0.82rem] text-emerald-800">
                Palavra-passe alterada. As outras sessões foram terminadas.
              </p>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "A guardar…" : "Guardar nova palavra-passe"}
            </Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
