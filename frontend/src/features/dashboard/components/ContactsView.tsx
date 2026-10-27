"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card, Container, Eyebrow } from "@/components/Surface";
import { ApiError } from "@/services/api.client";
import { contactService } from "@/services/contact.service";
import type {
  ContactListResponse,
  ContactRequest,
  ContactStatus,
} from "@/services/api.types";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Novo",
  READ: "Lido",
  REPLIED: "Respondido",
  ARCHIVED: "Arquivado",
};

const FILTERS: Array<{ value: ContactStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "READ", label: "Lidos" },
  { value: "REPLIED", label: "Respondidos" },
  { value: "ARCHIVED", label: "Arquivados" },
];

const STATUS_STYLES: Record<ContactStatus, string> = {
  NEW: "border-accent/40 bg-accent/[0.06] text-accent",
  READ: "border-line bg-paper text-ink-soft",
  REPLIED: "border-emerald-700/30 bg-emerald-700/[0.06] text-emerald-800",
  ARCHIVED: "border-line bg-paper text-ink-muted",
};

export function ContactsView() {
  const [filter, setFilter] = useState<ContactStatus | "ALL">("ALL");
  const [data, setData] = useState<ContactListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contactService.list(
        filter === "ALL" ? {} : { status: filter },
      );
      setData(response);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível carregar os pedidos.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(request: ContactRequest, status: ContactStatus) {
    setWorking(request.id);
    try {
      await contactService.updateStatus(request.id, status);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível atualizar.",
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <Container className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Caixa de entrada</Eyebrow>
          <h1 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.5rem]">
            Pedidos de contacto
          </h1>
          <p className="mt-2 max-w-[58ch] text-[0.88rem] text-ink-soft">
            Mensagens enviadas pelo formulário do site. Marca o que já viste e o
            que já respondeste.
          </p>
        </div>

        <p className="text-[0.72rem] uppercase tracking-[0.14em] text-ink-muted">
          {data ? `${data.counts.NEW} por responder` : "\u00a0"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.value;
          const count =
            item.value === "ALL"
              ? data?.total
              : data?.counts[item.value as ContactStatus];

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[0.75rem] transition-colors",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:border-ink/40",
              )}
            >
              {item.label}
              {count !== undefined && (
                <span className="ml-2 tabular-nums opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <Card className="border-accent/40 bg-accent/[0.04]">
          <p role="alert" className="text-[0.85rem] text-accent">
            {error}
          </p>
        </Card>
      )}

      {loading && !data && (
        <p className="text-[0.85rem] text-ink-muted">A carregar pedidos…</p>
      )}

      {data && data.items.length === 0 && (
        <Card>
          <p className="font-display text-[1.4rem]">Sem pedidos neste filtro.</p>
          <p className="mt-2 text-[0.85rem] text-ink-soft">
            Quando alguém escrever pelo site, a mensagem aparece aqui.
          </p>
        </Card>
      )}

      <ul className="space-y-4">
        {data?.items.map((request) => (
          <li key={request.id}>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[0.95rem] font-medium">{request.name}</p>
                  <p className="mt-1 text-[0.8rem] text-ink-muted">
                    {request.company ? `${request.company} · ` : ""}
                    <a
                      href={`mailto:${request.email}`}
                      className="underline decoration-line underline-offset-2 hover:text-accent"
                    >
                      {request.email}
                    </a>
                    {request.phone ? ` · ${request.phone}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em]",
                      STATUS_STYLES[request.status],
                    )}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                  <span className="text-[0.7rem] text-ink-muted">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              </div>

              <p className="whitespace-pre-line text-[0.9rem] leading-relaxed text-ink-soft">
                {request.message}
              </p>

              <div className="flex flex-wrap items-center gap-2 border-t border-line/70 pt-4">
                {request.status !== "READ" && request.status !== "REPLIED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={working === request.id}
                    onClick={() => void setStatus(request, "READ")}
                  >
                    Marcar como lido
                  </Button>
                )}
                {request.status !== "REPLIED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={working === request.id}
                    onClick={() => void setStatus(request, "REPLIED")}
                  >
                    Marcar como respondido
                  </Button>
                )}
                {request.status !== "ARCHIVED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="underline decoration-line underline-offset-4"
                    disabled={working === request.id}
                    onClick={() => void setStatus(request, "ARCHIVED")}
                  >
                    Arquivar
                  </Button>
                )}
                {request.status !== "NEW" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="underline decoration-line underline-offset-4"
                    disabled={working === request.id}
                    onClick={() => void setStatus(request, "NEW")}
                  >
                    Marcar como novo
                  </Button>
                )}
                {request.handledAt && (
                  <span className="ml-auto text-[0.68rem] text-ink-muted">
                    Tratado em {formatDate(request.handledAt)}
                  </span>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  );
}
