"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Badge, Card, Container, Eyebrow } from "@/components/Surface";
import { useAuth } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/features/auth/roles";
import { ApiError } from "@/services/api.client";
import { auditService, type AuditEntry } from "@/services/audit.service";
import type { ContactStatus, Role } from "@/services/api.types";
import { formatDateTime } from "@/utils/format";

const ACTION_LABELS: Record<string, string> = {
  "auth.password_changed": "Alterou a própria palavra-passe",
  "user.created": "Criou uma conta",
  "user.role_changed": "Alterou um papel",
  "user.activated": "Reativou uma conta",
  "user.deactivated": "Desativou uma conta",
  "user.password_reset": "Repôs uma palavra-passe",
  "contact.status_changed": "Alterou o estado de um pedido",
};

const ENTITY_LABELS: Record<string, string> = {
  auth: "Sessão",
  user: "Utilizador",
  contact: "Pedido",
};

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Novo",
  READ: "Lido",
  REPLIED: "Respondido",
  ARCHIVED: "Arquivado",
};

function describe(entry: AuditEntry, email?: string | null): string {
  const meta = entry.metadata ?? {};

  if (entry.action === "user.role_changed") {
    const from = typeof meta.from === "string" ? meta.from : null;
    const to = typeof meta.to === "string" ? meta.to : null;
    const who = typeof meta.email === "string" ? meta.email : "conta";
    return `${who}: ${from ? ROLE_LABELS[from as Role] : "—"} → ${
      to ? ROLE_LABELS[to as Role] : "—"
    }`;
  }

  if (entry.action === "contact.status_changed") {
    const from = typeof meta.from === "string" ? meta.from : null;
    const to = typeof meta.to === "string" ? meta.to : null;
    const subject = typeof meta.subject === "string" ? meta.subject : null;
    const change = `${from ? STATUS_LABELS[from as ContactStatus] : "—"} → ${
      to ? STATUS_LABELS[to as ContactStatus] : "—"
    }`;
    return subject ? `${change} · ${subject}` : change;
  }

  if (entry.action === "user.created") {
    const role = typeof meta.role === "string" ? meta.role : null;
    const who = typeof meta.email === "string" ? meta.email : "conta";
    return `${who}${role ? ` · ${ROLE_LABELS[role as Role]}` : ""}`;
  }

  if (
    entry.action === "user.activated" ||
    entry.action === "user.deactivated" ||
    entry.action === "user.password_reset"
  ) {
    return typeof meta.email === "string" ? meta.email : "—";
  }

  return email ?? "—";
}

export function AuditView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [items, setItems] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (target: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await auditService.list(target);
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível carregar o histórico.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load(1);
  }, [load, isAdmin]);

  if (!isAdmin) {
    return (
      <Container>
        <Card>
          <h1 className="font-display text-[1.6rem]">Acesso reservado</h1>
          <p className="mt-2 text-[0.88rem] text-ink-soft">
            O histórico de atividade está limitado a administradores.
          </p>
        </Card>
      </Container>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / 30));

  return (
    <Container className="space-y-8">
      <div>
        <Eyebrow>Auditoria</Eyebrow>
        <h1 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.5rem]">
          Atividade
        </h1>
        <p className="mt-2 max-w-[60ch] text-[0.88rem] text-ink-soft">
          Quem fez o quê, quando e a partir de que endereço. O histórico não pode
          ser editado pela interface e sobrevive à eliminação das contas.
        </p>
        {total > 0 && (
          <p className="mt-3 text-[0.72rem] uppercase tracking-[0.14em] text-ink-muted">
            {total} registos · mais recente primeiro
          </p>
        )}
      </div>

      {error && (
        <Card className="border-accent/40 bg-accent/[0.04]">
          <p role="alert" className="text-[0.85rem] text-accent">
            {error}
          </p>
        </Card>
      )}

      {loading && items.length === 0 && (
        <p className="text-[0.85rem] text-ink-muted">A carregar histórico…</p>
      )}

      {!loading && items.length === 0 && !error && (
        <Card>
          <p className="font-display text-[1.4rem]">Ainda sem registos.</p>
          <p className="mt-2 text-[0.85rem] text-ink-soft">
            A partir de agora, cada alteração de conta, papel ou estado de pedido
            fica registada aqui.
          </p>
        </Card>
      )}

      <ul className="space-y-2">
        {items.map((entry) => (
          <li key={entry.id}>
            <Card className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-[0.9rem]">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </p>
                <p className="mt-1 text-[0.8rem] text-ink-muted">
                  {describe(entry, entry.actorEmail)}
                </p>
                <p className="mt-1 text-[0.7rem] text-ink-muted">
                  por {entry.actorEmail ?? "sistema"}
                  {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge>{ENTITY_LABELS[entry.entity] ?? entry.entity}</Badge>
                <span className="text-[0.7rem] text-ink-muted">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {total > 30 && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
          >
            Anterior
          </Button>
          <p className="text-[0.75rem] text-ink-muted">
            Página {page} de {pageCount} · {total} registos
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount || loading}
            onClick={() => void load(page + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </Container>
  );
}
