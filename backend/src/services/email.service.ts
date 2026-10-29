import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import {
  renderContactNotification,
  renderPasswordReset,
  type ContactEmailInput,
} from "./email.templates.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type SendParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Envio pela API do Resend. O HTML e o texto vêm de `email.templates.ts`, para
 * que a identidade e a estrutura vivam num único sítio.
 */
async function send({ to, subject, html, text, replyTo }: SendParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_NOTIFY_FROM,
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html,
      text,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
  }
}

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
    const { subject, html, text } = renderPasswordReset({
      name: params.name,
      token: params.token,
      expiresMinutes: params.expiresMinutes,
    });

    await send({ to: params.to, subject, html, text });
  },

  async sendContactNotification(contact: ContactEmailInput): Promise<void> {
    if (!env.RESEND_API_KEY) {
      logger.debug("Notificação de contacto desativada (sem RESEND_API_KEY)");
      return;
    }

    const { subject, html, text } = renderContactNotification(contact);

    await send({
      to: env.CONTACT_NOTIFY_TO,
      subject,
      html,
      text,
      replyTo: contact.email,
    });

    logger.info({ contactId: contact.id }, "Notificação de contacto enviada");
  },
};
