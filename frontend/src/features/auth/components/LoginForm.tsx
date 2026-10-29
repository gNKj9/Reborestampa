"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Input } from "@/components/Input";
import { ApiError } from "@/services/api.client";
import { useAuth } from "../auth-context";

type FieldErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/painel");
    }
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await login({ email, password });
      router.replace("/painel");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setFormError("Email ou password incorretos.");
        } else if (error.status === 429) {
          setFormError(
            "Demasiadas tentativas de autenticação. Aguarda alguns minutos.",
          );
        } else if (error.status === 422 && error.details) {
          const next: FieldErrors = {};
          for (const detail of error.details) {
            if (detail.field === "email") next.email = detail.message;
            if (detail.field === "password") next.password = detail.message;
          }
          setFieldErrors(next);
          setFormError(Object.keys(next).length ? null : error.message);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Não foi possível contactar o servidor. Tenta novamente.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field id="email" label="Email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="nome@empresa.pt"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.email)}
        />
      </Field>

      <Field id="password" label="Palavra-passe" error={fieldErrors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </Field>

      {formError && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-[0.84rem] text-accent-deep"
        >
          {formError}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "A entrar…" : "Entrar"}
      </Button>

      <p className="text-center">
        <Link
          href="/recuperar"
          className="text-[0.76rem] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-accent"
        >
          Esqueceste-te da palavra-passe?
        </Link>
      </p>

      <p className="text-center text-[0.72rem] leading-relaxed text-ink-muted">
        Acesso restrito. As contas são criadas pelo administrador da plataforma.
      </p>
    </form>
  );
}
