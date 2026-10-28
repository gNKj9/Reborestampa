"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/Button";
import { Input } from "@/components/Input";
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

const PAGE_SIZE = 20;

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

function NotifyState({ request }: { request: ContactRequest }) {
  if (request.notifyStatus === "SENT") {
    return (
      <p className="flex items-center gap-2 text-[0.7rem] text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
        Aviso por email enviado
        {request.notifiedAt ? ` · ${formatDate(request.notifiedAt)}` : ""}
      </p>
    );
  }

  if (request.notifyStatus === "DISABLED") {
    return (
      <p className="flex items-center gap-2 text-[0.7rem] text-ink-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" aria-hidden="true" />
        Aviso por email desativado — falta configurar RESEND_API_KEY
      </p>
    );
  }

  if (request.notifyStatus === "FAILED") {
    return (
      <p className="flex items-start gap-2 text-[0.7rem] text-accent">
        <span
          className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
          aria-hidden="true"
        />
        <span>
          O aviso por email falhou
          {request.notifyError ? `: ${request.notifyError}` : "."}
        </span>
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-[0.7rem] text-ink-muted">
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted"
        aria-hidden="true"
      />
      Aviso por email a caminho…
    </p>
  );
}

function NoteEditor({
  request,
  onSaved,
}: {
  request: ContactRequest;
  onSaved: (updated: ContactRequest) => void;
}) {
  const [value, setValue] = useState(request.internalNote ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(request.noteUpdatedAt);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const updated = await contactService.updateNote(request.id, value);
      setSavedAt(updated.noteUpdatedAt);
      onSaved(updated);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível guardar.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="group border-t border-line/70 pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[0.75rem] text-ink-soft transition-colors hover:text-ink">
        <span className="text-ink-muted transition-transform group-open:rotate-90">
          ›
        </span>
        Nota interna
        {request.internalNote && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-ink-muted">
            preenchida
          </span>
        )}
      </summary>

      <form onSubmit={save} className="mt-3 space-y-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Ex.: pediu prova de cor para 6 cores; responder até sexta."
          className="w-full resize-y rounded-lg border border-ink/20 bg-white/70 px-3 py-2 text-[0.85rem] text-ink placeholder:text-ink-muted/80 focus:border-accent focus:bg-white focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "A guardar…" : "Guardar nota"}
          </Button>

          <p className="text-[0.68rem] text-ink-muted">
            Visível apenas para a equipa.
            {savedAt ? ` Atualizada em ${formatDate(savedAt)}.` : ""}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[0.78rem] text-accent">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}

export function ContactsView() {
  const [filter, setFilter] = useState<ContactStatus | "ALL">("ALL");
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ContactListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Pesquisa com atraso curto: não dispara um pedido por tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(term.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contactService.list({
        status: filter === "ALL" ? undefined : filter,
        q: query || undefined,
        page,
        limit: PAGE_SIZE,
      });
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
  }, [filter, query, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function replaceRequest(updated: ContactRequest) {
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          }
        : current,
    );
  }

  async function setStatus(request: ContactRequest, status: ContactStatus) {
    setWorking(request.id);
    try {
      const updated = await contactService.updateStatus(request.id, status);
      replaceRequest(updated);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível atualizar.",
      );
    } finally {
      setWorking(null);
    }
  }

  async function exportCsv() {
    setExporting(true);
    setError(null);
    try {
      await contactService.downloadCsv({
        status: filter === "ALL" ? undefined : filter,
        q: query || undefined,
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível exportar.",
      );
    } finally {
      setExporting(false);
    }
  }

  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Container className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Caixa de entrada</Eyebrow>
          <h1 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.5rem]">
            Pedidos de contacto
          </h1>
          <p className="mt-2 max-w-[58ch] text-[0.88rem] text-ink-soft">
            Mensagens enviadas pelo formulário do site. Pesquisa por nome, email,
            empresa ou texto — a pesquisa vale só para os pedidos.
          </p>
        </div>

        <p className="text-[0.72rem] uppercase tracking-[0.14em] text-ink-muted">
          {data
            ? `${data.counts.NEW} por responder · ${data.total} no filtro`
            : "\u00a0"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="contact-search" className="sr-only">
            Pesquisar pedidos
          </label>
          <Input
            id="contact-search"
            type="search"
            placeholder="Pesquisar por nome, email, empresa ou mensagem…"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void exportCsv()}
          disabled={exporting || !data || data.total === 0}
        >
          {exporting ? "A exportar…" : "Exportar CSV"}
        </Button>
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
              onClick={() => {
                setFilter(item.value);
                setPage(1);
              }}
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
          <p className="font-display text-[1.4rem]">
            {query
              ? "Nenhum pedido corresponde à pesquisa."
              : "Sem pedidos neste filtro."}
          </p>
          <p className="mt-2 text-[0.85rem] text-ink-soft">
            {query
              ? "Tenta outro nome, email ou palavra."
              : "Quando alguém escrever pelo site, a mensagem aparece aqui."}
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
                <ButtonLink
                  href={`mailto:${request.email}?subject=${encodeURIComponent(
                    "Resposta ao teu pedido — Reborestampa",
                  )}`}
                  size="sm"
                >
                  Responder
                </ButtonLink>

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

              <NotifyState request={request} />

              <NoteEditor request={request} onSaved={replaceRequest} />
            </Card>
          </li>
        ))}
      </ul>

      {data && data.total > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>

          <p className="text-[0.75rem] text-ink-muted">
            Página {data.page} de {pageCount} · {data.total} pedidos
          </p>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </Container>
  );
}
