import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type ContactPayload = {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  message: string;
};

/**
 * Notificações por email (Resend).
 *
 * Opcional por desenho: sem `RESEND_API_KEY` o site funciona igual, os pedidos
 * ficam na caixa de entrada e o aviso é apenas registado como desativado.
 */
export const emailService = {
  enabled(): boolean {
    return Boolean(env.RESEND_API_KEY);
  },

  async sendPasswordReset(params: {
    to: string;
    name: string;
    token: string;
    expiresMinutes: number;
  }): Promise<void> {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const link = `${env.PUBLIC_SITE_URL}/redefinir?token=${encodeURIComponent(params.token)}`;
    const name = escapeHtml(params.name);
    const safeLink = escapeHtml(link);

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#17140f;max-width:560px">
        <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b6459">Reborestampa</p>
        <h1 style="font-size:22px;margin:12px 0 16px">Redefinir palavra-passe</h1>
        <p style="font-size:14px;line-height:1.6">Olá ${name}, recebemos um pedido para redefinir a palavra-passe da tua conta.</p>
        <p style="margin:24px 0">
          <a href="${safeLink}" style="background:#c2185b;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-size:14px">
            Escolher nova palavra-passe
          </a>
        </p>
        <p style="font-size:13px;color:#6b6459;line-height:1.6">
          O link expira em ${params.expiresMinutes} minutos e só pode ser usado uma vez.
          Se não pediste nada, ignora este email — a palavra-passe atual continua válida.
        </p>
      </div>
    `.trim();

    const text = [
      "Redefinir palavra-passe — Reborestampa",
      "",
      `Olá ${params.name},`,
      "Recebemos um pedido para redefinir a palavra-passe da tua conta.",
      "",
      link,
      "",
      `O link expira em ${params.expiresMinutes} minutos e só pode ser usado uma vez.`,
      "Se não pediste nada, ignora este email.",
    ].join("\n");

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_NOTIFY_FROM,
        to: [params.to],
        subject: "Redefinir palavra-passe — Reborestampa",
        html,
        text,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
    }
  },

  async sendContactNotification(contact: ContactPayload): Promise<void> {
    if (!env.RESEND_API_KEY) {
      logger.debug("Notificação de contacto desativada (sem RESEND_API_KEY)");
      return;
    }

    const name = escapeHtml(contact.name);
    const email = escapeHtml(contact.email);
    const company = contact.company ? escapeHtml(contact.company) : null;
    const phone = contact.phone ? escapeHtml(contact.phone) : null;
    const message = escapeHtml(contact.message).replaceAll("\n", "<br />");

    const rows = [
      ["Nome", name],
      ["Email", email],
      ...(company ? [["Empresa", company]] : []),
      ...(phone ? [["Telefone", phone]] : []),
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#6b6459;font-size:13px">${label}</td><td style="padding:4px 0;font-size:14px">${value}</td></tr>`,
      )
      .join("");

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#17140f;max-width:560px">
        <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b6459">Novo pedido de contacto</p>
        <h1 style="font-size:22px;margin:12px 0 20px">${name}</h1>
        <table style="border-collapse:collapse">${rows}</table>
        <div style="margin:20px 0;padding:16px;background:#f3efe7;border-radius:12px;font-size:14px;line-height:1.6">
          ${message}
        </div>
        <p style="font-size:13px;color:#6b6459">
          Responde diretamente a este email ou abre a
          <a href="${env.PUBLIC_SITE_URL}/painel/contactos" style="color:#c2185b">caixa de entrada</a>.
        </p>
      </div>
    `.trim();

    const text = [
      "Novo pedido de contacto",
      "",
      `Nome: ${contact.name}`,
      `Email: ${contact.email}`,
      contact.company ? `Empresa: ${contact.company}` : null,
      contact.phone ? `Telefone: ${contact.phone}` : null,
      "",
      contact.message,
      "",
      `Caixa de entrada: ${env.PUBLIC_SITE_URL}/painel/contactos`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_NOTIFY_FROM,
        to: [env.CONTACT_NOTIFY_TO],
        reply_to: contact.email,
        subject: `Novo pedido de contacto — ${contact.name}`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
    }

    logger.info({ contactId: contact.id }, "Notificação de contacto enviada");
  },
};
