"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Input } from "@/components/Input";
import { Badge, Card, Container, Eyebrow } from "@/components/Surface";
import { useAuth } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/features/auth/roles";
import { ApiError } from "@/services/api.client";
import { ROLES, type PublicUser, type Role } from "@/services/api.types";
import { userService } from "@/services/user.service";
import { generatePassword } from "@/utils/password";
import { formatDate } from "@/utils/format";

const selectClass =
  "w-full rounded-lg border border-line bg-white/70 px-3 py-2 text-[0.85rem] text-ink focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-muted";

export function UsersView() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    password: "",
    role: "VIEWER" as Role,
  });

  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.list();
      setUsers(response.items);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível carregar as contas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [load, isAdmin]);

  if (!isAdmin) {
    return (
      <Container>
        <Card>
          <h1 className="font-display text-[1.6rem]">Acesso reservado</h1>
          <p className="mt-2 text-[0.88rem] text-ink-soft">
            A gestão de utilizadores está limitada a administradores. Pede a um
            administrador para alterar o teu papel, se precisares deste acesso.
          </p>
        </Card>
      </Container>
    );
  }

  async function changeRole(target: PublicUser, role: Role) {
    setWorking(target.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await userService.updateAccess(target.id, { role });
      setUsers((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`Papel de ${updated.name} atualizado para ${ROLE_LABELS[role]}.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Falhou a alteração.");
    } finally {
      setWorking(null);
    }
  }

  async function toggleActive(target: PublicUser) {
    setWorking(target.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await userService.updateAccess(target.id, {
        isActive: !target.isActive,
      });
      setUsers((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `${updated.name} ${updated.isActive ? "reativado" : "desativado"}.`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Falhou a alteração.");
    } finally {
      setWorking(null);
    }
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking("new");
    setError(null);
    setNotice(null);
    try {
      const created = await userService.create({
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password,
        role: draft.role,
      });
      setUsers((list) => [created, ...list]);
      setDraft({ name: "", email: "", password: "", role: "VIEWER" });
      setShowCreate(false);
      setNotice(`Conta criada para ${created.email}.`);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível criar.",
      );
    } finally {
      setWorking(null);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetFor) return;

    setWorking(resetFor);
    setError(null);
    setNotice(null);
    try {
      const updated = await userService.resetPassword(resetFor, resetValue);
      setUsers((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `Palavra-passe de ${updated.name} reposta. As sessões dessa conta foram terminadas.`,
      );
      setResetFor(null);
      setResetValue("");
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível repor.",
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <Container className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Administração</Eyebrow>
          <h1 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.5rem]">
            Utilizadores
          </h1>
          <p className="mt-2 max-w-[58ch] text-[0.88rem] text-ink-soft">
            Quem entra na área reservada. Um administrador não pode alterar o
            próprio papel nem desativar a última conta de administração.
          </p>
        </div>

        <Button size="sm" onClick={() => setShowCreate((open) => !open)}>
          {showCreate ? "Fechar" : "Nova conta"}
        </Button>
      </div>

      {notice && (
        <Card className="border-emerald-700/30 bg-emerald-700/[0.05]">
          <p role="status" className="text-[0.85rem] text-emerald-900">
            {notice}
          </p>
        </Card>
      )}

      {error && (
        <Card className="border-accent/40 bg-accent/[0.04]">
          <p role="alert" className="text-[0.85rem] text-accent">
            {error}
          </p>
        </Card>
      )}

      {showCreate && (
        <Card>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
            Nova conta
          </h2>

          <form onSubmit={createAccount} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="new-name" label="Nome">
              <Input
                id="new-name"
                required
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>

            <Field id="new-email" label="Email">
              <Input
                id="new-email"
                type="email"
                required
                autoComplete="off"
                value={draft.email}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
              />
            </Field>

            <Field
              id="new-password"
              label="Palavra-passe"
              hint="12+ caracteres"
            >
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  value={draft.password}
                  onChange={(event) =>
                    setDraft({ ...draft, password: event.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, password: generatePassword() })
                  }
                >
                  Gerar
                </Button>
              </div>
            </Field>

            <Field id="new-role" label="Papel">
              <select
                id="new-role"
                className={selectClass}
                value={draft.role}
                onChange={(event) =>
                  setDraft({ ...draft, role: event.target.value as Role })
                }
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={working === "new"}>
                {working === "new" ? "A criar…" : "Criar conta"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && users.length === 0 && (
        <p className="text-[0.85rem] text-ink-muted">A carregar contas…</p>
      )}

      <div className="space-y-3">
        {users.map((item) => {
          const isSelf = item.id === currentUser?.id;

          return (
            <Card key={item.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.95rem] font-medium">
                    {item.name}
                    {isSelf && (
                      <span className="ml-2 text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                        tu
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[0.8rem] text-ink-muted">{item.email}</p>
                  <p className="mt-1 text-[0.7rem] text-ink-muted">
                    Último acesso: {formatDate(item.lastLoginAt)}
                  </p>
                </div>

                <Badge>{item.isActive ? "Ativa" : "Desativada"}</Badge>
              </div>

              <div className="flex flex-wrap items-end gap-3 border-t border-line/70 pt-4">
                <label className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted">
                  Papel
                  <select
                    className={`${selectClass} mt-1`}
                    value={item.role}
                    disabled={isSelf || working === item.id}
                    onChange={(event) =>
                      void changeRole(item, event.target.value as Role)
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSelf || working === item.id}
                  onClick={() => void toggleActive(item)}
                >
                  {item.isActive ? "Desativar" : "Reativar"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSelf}
                  onClick={() => {
                    setResetFor(resetFor === item.id ? null : item.id);
                    setResetValue("");
                  }}
                >
                  Repor palavra-passe
                </Button>
              </div>

              {resetFor === item.id && (
                <form
                  onSubmit={resetPassword}
                  className="flex flex-wrap items-end gap-3 rounded-xl bg-paper-deep/60 p-4"
                >
                  <Field
                    id={`reset-${item.id}`}
                    label="Nova palavra-passe"
                    className="flex-1"
                    hint="termina as sessões desta conta"
                  >
                    <div className="flex gap-2">
                      <Input
                        id={`reset-${item.id}`}
                        required
                        minLength={12}
                        autoComplete="new-password"
                        value={resetValue}
                        onChange={(event) => setResetValue(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResetValue(generatePassword())}
                      >
                        Gerar
                      </Button>
                    </div>
                  </Field>

                  <Button type="submit" size="sm" disabled={working === item.id}>
                    {working === item.id ? "A repor…" : "Repor"}
                  </Button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
