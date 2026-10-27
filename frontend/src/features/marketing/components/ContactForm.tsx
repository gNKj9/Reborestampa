"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Input } from "@/components/Input";
import { ApiError } from "@/services/api.client";
import { contactService } from "@/services/contact.service";

const EMPTY = {
  name: "",
  email: "",
  company: "",
  phone: "",
  message: "",
  website: "",
};

type State = typeof EMPTY;

export function ContactForm() {
  const [form, setForm] = useState<State>(EMPTY);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(field: keyof State, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.message.trim().length < 10) {
      setError("Descreve o pedido com pelo menos 10 caracteres.");
      return;
    }

    setPending(true);
    try {
      await contactService.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
        website: form.website,
      });
      setSent(true);
      setForm(EMPTY);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível enviar. Tenta novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-paper p-8 text-ink">
        <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ink-muted">
          Pedido enviado
        </p>
        <p className="mt-4 font-display text-[1.6rem] leading-tight">
          Obrigado. Recebemos a tua mensagem.
        </p>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
          Respondemos para o email indicado. Se o assunto for urgente, o LinkedIn
          da empresa está ao lado.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => setSent(false)}
        >
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-paper p-6 text-ink sm:p-8">
      <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ink-muted">
        Pedido de contacto
      </p>
      <p className="mt-2 text-[0.75rem] text-ink-muted">
        Nome, email e mensagem são obrigatórios.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Nome">
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>

        <Field id="contact-email" label="Email">
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </Field>

        <Field id="contact-company" label="Empresa" hint="opcional">
          <Input
            id="contact-company"
            name="company"
            autoComplete="organization"
            value={form.company}
            onChange={(event) => update("company", event.target.value)}
          />
        </Field>

        <Field id="contact-phone" label="Telefone" hint="opcional">
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="Ex.: +351 912 345 678"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
      </div>

      <Field
        id="contact-message"
        label="Mensagem"
        className="mt-4"
        hint={`${form.message.length}/2000`}
      >
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={2000}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          className="w-full resize-y rounded-lg border border-ink/20 bg-white/70 px-4 py-3 text-[0.95rem] text-ink transition-colors placeholder:text-ink-muted focus:border-accent focus:bg-white focus:outline-none"
          placeholder="Escreve aqui o teu pedido."
        />
        <p className="text-[0.72rem] leading-relaxed text-ink-muted">
          Indica o tecido, o motivo, o número de cores e o prazo pretendido —
          ajuda-nos a responder com uma proposta útil.
        </p>
      </Field>

      {/* Honeypot: invisível para pessoas, apetitoso para bots. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[0.82rem] text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "A enviar…" : "Enviar pedido"}
        </Button>
        <p className="max-w-[34ch] text-[0.72rem] leading-relaxed text-ink-muted">
          Usamos os dados apenas para responder a este pedido.{" "}
          <Link
            href="/privacidade"
            className="underline decoration-line underline-offset-2 hover:text-accent"
          >
            Política de privacidade
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
