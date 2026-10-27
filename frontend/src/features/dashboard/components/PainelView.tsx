"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { Badge, Card, Container, Eyebrow } from "@/components/Surface";
import { useAuth } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/features/auth/roles";
import { systemService } from "@/services/system.service";
import { formatDate, initials } from "@/utils/format";

type Readiness = "checking" | "ready" | "unavailable";

const NEXT_STEPS = [
  "Modelar o domínio: clientes, encomendas, referências e provas de cor.",
  "Ligar cada técnica de estampagem a fichas técnicas e consumos.",
  "Adicionar auditoria de ações e histórico de alterações.",
  "Configurar um pipeline de CI com testes e análise de dependências.",
];

export function PainelView() {
  const { user, logout, accessTokenExpiresAt } = useAuth();
  const [readiness, setReadiness] = useState<Readiness>("checking");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

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

  useEffect(() => {
    void checkReadiness();
  }, [checkReadiness]);

  if (!user) return null;

  const statusLabel: Record<Readiness, string> = {
    checking: "A verificar…",
    ready: "Operacional",
    unavailable: "Indisponível",
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <Container className="flex h-[68px] items-center justify-between gap-4">
          <Link href="/" aria-label="Reborestampa — site">
            <Logo compact />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[0.8rem] leading-tight">{user.name}</p>
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-ink-muted">
                {ROLE_LABELS[user.role]}
              </p>
            </div>

            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[0.7rem] font-medium text-paper">
              {initials(user.name)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void logout();
              }}
            >
              Sair
            </Button>
          </div>
        </Container>
      </header>

      <main className="py-12">
        <Container className="space-y-8">
          <div>
            <Eyebrow>Painel</Eyebrow>
            <h1 className="mt-4 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
              Olá, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-[60ch] text-[0.9rem] text-ink-soft">
              Esta é a base da plataforma: autenticação, sessão e ligação à base
              de dados já a funcionar. O domínio de negócio entra a seguir.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
                  Sessão ativa
                </h2>
                <Badge>{user.isActive ? "Ativa" : "Suspensa"}</Badge>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                    Email
                  </dt>
                  <dd className="mt-1 text-[0.9rem]">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                    Papel
                  </dt>
                  <dd className="mt-1 text-[0.9rem]">{ROLE_LABELS[user.role]}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                    Último acesso
                  </dt>
                  <dd className="mt-1 text-[0.9rem]">{formatDate(user.lastLoginAt)}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                    Access token expira
                  </dt>
                  <dd className="mt-1 text-[0.9rem]">
                    {formatDate(accessTokenExpiresAt)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
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

            <Card>
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
                Tokens
              </h2>
              <ul className="mt-4 space-y-3 text-[0.82rem] text-ink-soft">
                <li className="flex justify-between gap-3">
                  <span>Access</span>
                  <span className="text-ink-muted">15 min · memória</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Refresh</span>
                  <span className="text-ink-muted">7 dias · HttpOnly</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>SameSite</span>
                  <span className="text-ink-muted">Strict</span>
                </li>
              </ul>
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
                Próximos passos
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
      </main>
    </div>
  );
}
