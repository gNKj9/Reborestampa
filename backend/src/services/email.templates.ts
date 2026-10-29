/**
 * Modelos de email transacional.
 *
 * Regras que valem para todos:
 * - HTML de email não é HTML de browser: tabelas para layout, estilos inline,
 *   nada de flexbox/grid, e uma largura máxima de 560 px.
 * - Fundo e texto declarados explicitamente, com `color-scheme: light only`,
 *   para o modo escuro do cliente não inverter a identidade.
 * - Identidade do site: papel (#f3efe7), tinta (#17140f), terracota (#c2185b)
 *   usada com parcimónia — um traço, um filete, um botão.
 * - Sem imagens: metade dos clientes bloqueia-as por omissão, e a marca em texto
 *   lê-se sempre.
 */
import { env } from "../config/env.js";

const PAPER = "#f3efe7";
const PAPER_DEEP = "#e9e1d3";
const INK = "#17140f";
const INK_SOFT = "#4f483a";
const INK_MUTED = "#655c4d";
const LINE = "#d9d0bf";
const ACCENT = "#c2185b";

const SERIF = "Georgia,'Iowan Old Style','Times New Roman',serif";
const SANS =
  "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type LayoutOptions = {
  title: string;
  preheader: string;
  /** Coluna direita do cabeçalho, em maiúsculas pequenas. */
  kicker: string;
  body: string;
};

function layout({ title, preheader, kicker, body }: LayoutOptions): string {
  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(title)}</title>
  <style>
    /* Empilhamento em ecrãs estreitos. Outlook desktop ignora media queries —
       fica com o layout de duas colunas, que é o que se quer lá. */
    @media only screen and (max-width: 480px) {
      .col { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
      .col-last { padding-bottom: 0 !important; }
      .cta-cell { display: block !important; width: 100% !important; text-align: left !important; }
      .cta-cell + .cta-cell { padding-top: 14px !important; }
      .cta-btn { width: 100% !important; }
      .cta-btn td { width: 100% !important; }
      .cta-btn a { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:36px 16px 44px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 4px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-family:${SANS};font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:${INK};">
                    <span style="display:inline-block;width:6px;height:6px;background-color:${ACCENT};margin-right:8px;vertical-align:1px;"></span>Reborestampa
                  </td>
                  <td align="right" style="font-family:${SANS};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${INK_MUTED};">
                    ${escapeHtml(kicker)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px;font-size:0;line-height:0;">
              <div style="height:1px;background-color:${LINE};line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px;">
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="cta-btn">
    <tr>
      <td bgcolor="${INK}" style="border-radius:999px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 24px;font-family:${SANS};font-size:13px;line-height:1;color:${PAPER};text-decoration:none;letter-spacing:.01em;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function footer(note: string): string {
  return `<tr>
    <td style="padding:0 4px;">
      <div style="height:1px;background-color:${LINE};line-height:1px;font-size:0;">&nbsp;</div>
      <p style="margin:18px 0 0;font-family:${SANS};font-size:11px;line-height:1.6;color:${INK_MUTED};">
        ${note}
      </p>
      <p style="margin:6px 0 0;font-family:${SANS};font-size:11px;line-height:1.6;color:${INK_MUTED};">
        Reborestampa · Rua Silva Araújo 1185 · 4795-120 Vila&nbsp;das&nbsp;Aves<br />
        <a href="${escapeHtml(env.PUBLIC_SITE_URL)}/privacidade" style="color:${INK_MUTED};text-decoration:underline;">Política de privacidade</a>
      </p>
    </td>
  </tr>`;
}

export type ContactEmailInput = {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  message: string;
  createdAt?: Date;
};

export function renderContactNotification(contact: ContactEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml(contact.name);
  const email = escapeHtml(contact.email);
  const company = contact.company ? escapeHtml(contact.company) : null;
  const phone = contact.phone ? escapeHtml(contact.phone) : null;
  const messageHtml = escapeHtml(contact.message).replaceAll("\n", "<br />");
  const when = formatDate(contact.createdAt ?? new Date());

  const replySubject = encodeURIComponent(
    `Re: o teu pedido de contacto — Reborestampa`,
  );
  const mailto = `mailto:${contact.email}?subject=${replySubject}`;

  const details = [
    `<tr>
      <td class="col" style="padding:0 24px 0 0;vertical-align:top;">
        <p style="margin:0;font-family:${SANS};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${INK_MUTED};">Email</p>
        <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;">
          <a href="mailto:${email}" style="color:${INK};text-decoration:none;border-bottom:1px solid ${LINE};">${email}</a>
        </p>
      </td>
      ${
        phone
          ? `<td class="col col-last" style="vertical-align:top;">
        <p style="margin:0;font-family:${SANS};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${INK_MUTED};">Telefone</p>
        <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;">
          <a href="tel:${phone.replaceAll(" ", "")}" style="color:${INK};text-decoration:none;border-bottom:1px solid ${LINE};">${phone}</a>
        </p>
      </td>`
          : ""
      }
    </tr>`,
  ].join("");

  const body = `
    <h1 style="margin:26px 0 0;font-family:${SERIF};font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-.01em;color:${INK};">
      ${name}
    </h1>
    <p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${INK_MUTED};">
      ${company ? `${company} · ` : ""}${when}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
      <tr>
        <td style="padding:2px 0 2px 16px;border-left:2px solid ${ACCENT};">
          <div style="font-family:${SANS};font-size:15px;line-height:1.7;color:${INK_SOFT};">${messageHtml}</div>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;width:100%;">
      ${details}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 0;width:100%;">
      <tr>
        <td class="cta-cell" align="left">${button(`Responder a ${contact.name.split(" ")[0]}`, mailto)}</td>
        <td class="cta-cell" align="right" style="font-family:${SANS};font-size:12px;">
          <a href="${escapeHtml(env.PUBLIC_SITE_URL)}/painel/contactos" style="color:${INK_MUTED};text-decoration:underline;">Abrir na caixa de entrada</a>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0;width:100%;">
      ${footer(
        `Recebido através do formulário do site. Responde a este email para falar diretamente com ${name}.`,
      )}
    </table>
  `;

  const text = [
    "REBORESTAMPA — Pedido de contacto",
    "",
    contact.name,
    contact.company ? contact.company : null,
    when,
    "",
    contact.message,
    "",
    `Email: ${contact.email}`,
    contact.phone ? `Telefone: ${contact.phone}` : null,
    "",
    `Responder: ${contact.email}`,
    `Caixa de entrada: ${env.PUBLIC_SITE_URL}/painel/contactos`,
    "",
    "Reborestampa · Rua Silva Araújo 1185 · 4795-120 Vila das Aves",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    subject: `Novo pedido de contacto · ${contact.name}`,
    html: layout({
      title: `Pedido de contacto — ${contact.name}`,
      preheader: `${contact.company ? `${contact.company} — ` : ""}${contact.message.slice(0, 120)}`,
      kicker: "Novo contacto",
      body,
    }),
    text,
  };
}

export function renderPasswordReset(params: {
  name: string;
  token: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const link = `${env.PUBLIC_SITE_URL}/redefinir?token=${encodeURIComponent(params.token)}`;
  const name = escapeHtml(params.name);
  // Pontos de quebra depois de /, ? e = : a URL desce inteira em vez de partir
  // uma palavra a meio e deixar uma letra órfã.
  const escapedLinkWithBreaks = escapeHtml(link)
    .replaceAll("/", "/<wbr>")
    .replaceAll("?", "?<wbr>")
    .replaceAll("=", "=<wbr>");

  const body = `
    <h1 style="margin:28px 0 0;font-family:${SERIF};font-size:28px;line-height:1.2;font-weight:400;letter-spacing:-.01em;color:${INK};">
      Escolher nova palavra-passe
    </h1>
    <p style="margin:12px 0 0;font-family:${SANS};font-size:15px;line-height:1.7;color:${INK_SOFT};">
      Olá ${name}, recebemos um pedido para redefinir a palavra-passe da tua conta.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
      <tr><td>${button("Escolher nova palavra-passe", link)}</td></tr>
    </table>
    <p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${INK_MUTED};">
      O link expira em ${params.expiresMinutes} minutos e só pode ser usado uma vez.
      Se o botão não funcionar, copia este endereço:<br />
      <a href="${escapeHtml(link)}" style="color:${INK_MUTED};overflow-wrap:break-word;">${escapedLinkWithBreaks}</a>
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 0;width:100%;">
      ${footer("Se não pediste nada, ignora este email — a palavra-passe atual continua válida.")}
    </table>
  `;

  const text = [
    "REBORESTAMPA — Redefinir palavra-passe",
    "",
    `Olá ${params.name},`,
    "Recebemos um pedido para redefinir a palavra-passe da tua conta.",
    "",
    link,
    "",
    `O link expira em ${params.expiresMinutes} minutos e só pode ser usado uma vez.`,
    "Se não pediste nada, ignora este email — a palavra-passe atual continua válida.",
    "",
    "Reborestampa · Rua Silva Araújo 1185 · 4795-120 Vila das Aves",
  ].join("\n");

  return {
    subject: "Redefinir palavra-passe — Reborestampa",
    html: layout({
      title: "Redefinir palavra-passe — Reborestampa",
      preheader: `Link válido durante ${params.expiresMinutes} minutos, para uso único.`,
      kicker: "Conta",
      body,
    }),
    text,
  };
}

export const emailColors = {
  paper: PAPER,
  paperDeep: PAPER_DEEP,
  ink: INK,
  inkSoft: INK_SOFT,
  inkMuted: INK_MUTED,
  line: LINE,
  accent: ACCENT,
} as const;
