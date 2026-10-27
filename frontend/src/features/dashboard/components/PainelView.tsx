"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Badge, Card, Container, Eyebrow } from "@/components/Surface";
import { useAuth } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/features/auth/roles";
import { contactService } from "@/services/contact.service";
import { systemService } from "@/services/system.service";
import { userService } from "@/services/user.service";
import { formatDate } from "@/utils/format";

type Readiness = "checking" | "ready" | "unavailable";

const NEXT_STEPS = [
  "Responder aos pedidos de contacto em atraso.",
  "Rever papéis das contas e desativar acessos que já não são necessários.",
  "Alterar a palavra-passe sempre que alguém com acesso sai da empresa.",
];

export function PainelView() {
  const { user, accessTokenExpiresAt } = useAuth();
  const [readiness, setReadiness] = useState<Readiness>("checking");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [newRequests, setNewRequests] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  const checkReadiness = useCallback(async () => {
    setReadiness("checking");
    try {
      const result = await systemService.readiness();
      setReadiness(result.status === "ready" ? "ready" : "unavailable");
    } catch {
      setReadiness("unavailable");
    } finally {
      setCheckedAt(new Date().toISOString());
    }
  }, []);

  const loadCounters = useCallback(async () => {
    try {
      const requests = await contactService.list({ limit: 1 });
      setNewRequests(requests.counts.NEW);
    } catch {
      setNewRequests(null);
    }

    if (user?.role === "ADMIN") {
      try {
        const users = await userService.list();
        setTotalUsers(users.total);
      } catch {
        setTotalUsers(null);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    void checkReadiness();
    void loadCounters();
  }, [checkReadiness, loadCounters]);

  if (!user) return null;

  const statusLabel: Record<Readiness, string> = {
    checking: "A verificar…",
    ready: "Operacional",
    unavailable: "Indisponível",
  };

  return (
    <Container className="space-y-8">
      <div>
        <Eyebrow>Painel</Eyebrow>
        <h1 className="mt-4 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
          Olá, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-[62ch] text-[0.9rem] text-ink-soft">
          Pedidos de contacto, contas e sessão num só lugar. As ações ficam
          registadas com data e autor.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-6">
        <Card className="lg:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
              Sessão ativa
            </h2>
            <Badge>{user.isActive ? "Ativa" : "Suspensa"}</Badge>
          </div>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">
                Email
              </dt>
              <dd className="mt-1 text-[0.9rem]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">
                Papel
              </dt>
              <dd className="mt-1 text-[0.9rem]">{ROLE_LABELS[user.role]}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">
                Último acesso
              </dt>
              <dd className="mt-1 text-[0.9rem]">{formatDate(user.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">
                Sessão expira
              </dt>
              <dd className="mt-1 text-[0.9rem]">
                {formatDate(accessTokenExpiresAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
            Serviço
          </h2>

          <div className="mt-5 flex items-center gap-3">
            <span
              className={
                readiness === "ready"
                  ? "h-2.5 w-2.5 rounded-full bg-emerald-600"
                  : readiness === "checking"
                    ? "h-2.5 w-2.5 animate-pulse rounded-full bg-ink-muted"
                    : "h-2.5 w-2.5 rounded-full bg-accent"
              }
              aria-hidden="true"
            />
            <span className="text-[0.95rem]">{statusLabel[readiness]}</span>
          </div>

          <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-muted">
            {checkedAt
              ? `Verificado em ${formatDate(checkedAt)}`
              : "A contactar a API…"}
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="mt-4 px-0"
            onClick={() => {
              void checkReadiness();
            }}
          >
            Verificar novamente →
          </Button>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
            Pedidos de contacto
          </h2>
          <p className="mt-4 font-display text-[2rem] leading-none">
            {newRequests ?? "—"}
          </p>
          <p className="mt-2 text-[0.78rem] text-ink-muted">por responder</p>
          <Link
            href="/painel/contactos"
            className="mt-5 inline-flex text-[0.8rem] font-medium text-ink transition-colors hover:text-accent"
          >
            Abrir caixa de entrada →
          </Link>
        </Card>

        {user.role === "ADMIN" && (
          <Card className="lg:col-span-2">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
              Utilizadores
            </h2>
            <p className="mt-4 font-display text-[2rem] leading-none">
              {totalUsers ?? "—"}
            </p>
            <p className="mt-2 text-[0.78rem] text-ink-muted">contas criadas</p>
            <Link
              href="/painel/utilizadores"
              className="mt-5 inline-flex text-[0.8rem] font-medium text-ink transition-colors hover:text-accent"
            >
              Gerir contas →
            </Link>
          </Card>
        )}

        <Card className={user.role === "ADMIN" ? "lg:col-span-2" : "lg:col-span-4"}>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
            Boas práticas
          </h2>
          <ol className="mt-4 space-y-3">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-[0.84rem] text-ink-soft">
                <span className="text-[0.7rem] tabular-nums text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </Container>
  );
}
