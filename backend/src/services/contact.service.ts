import { logger } from "../config/logger.js";
import type { ContactStatus } from "../models/contact.schema.js";
import {
  toPublicContact,
  type PublicContactRequest,
} from "../models/contact.schema.js";
import { contactRepository } from "../repositories/contact.repository.js";

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Novo",
  READ: "Lido",
  REPLIED: "Respondido",
  ARCHIVED: "Arquivado",
};

/** Célula CSV: aspas duplicadas e quebras de linha normalizadas. */
function csvCell(value: string | null | undefined): string {
  const text = (value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replaceAll('"', '""')}"`;
}
import { AppError } from "../utils/AppError.js";
import { auditService, type AuditActor } from "./audit.service.js";
import { emailService } from "./email.service.js";

/**
 * Pedidos de contacto.
 * O formulário é público, por isso a criação não revela nada sobre o resultado:
 * um honeypot preenchido é descartado em silêncio, para não ensinar o bot.
 */
export const contactService = {
  async create(
    input: {
      name: string;
      email: string;
      company?: string;
      phone?: string;
      message: string;
      website?: string;
    },
    context: { ipAddress?: string },
  ): Promise<void> {
    if (input.website && input.website.trim() !== "") {
      logger.warn(
        { ip: context.ipAddress },
        "Pedido de contacto descartado (honeypot preenchido)",
      );
      return;
    }

    const created = await contactRepository.create({
      name: input.name,
      email: input.email,
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      message: input.message,
    });

    // Nunca registamos a mensagem nos logs — só o facto de ter chegado.
    logger.info({ ip: context.ipAddress }, "Novo pedido de contacto");

    // Aviso por email em segundo plano. O resultado fica registado no próprio
    // pedido, para se saber no painel se o aviso saiu, falhou ou está desativado.
    void (async () => {
      try {
        if (!emailService.enabled()) {
          await contactRepository.setNotifyStatus(created.id, "DISABLED");
          return;
        }

        await emailService.sendContactNotification(created);
        await contactRepository.setNotifyStatus(created.id, "SENT");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        logger.warn(
          { err: error },
          "Não foi possível enviar a notificação de contacto",
        );
        await contactRepository.setNotifyStatus(created.id, "FAILED", message);
      }
    })();
  },

  async list(params: {
    status?: ContactStatus;
    q?: string;
    page: number;
    limit: number;
  }): Promise<{
    items: PublicContactRequest[];
    total: number;
    page: number;
    limit: number;
    counts: Record<ContactStatus, number>;
  }> {
    const skip = (params.page - 1) * params.limit;
    const [{ items, total }, grouped] = await Promise.all([
      contactRepository.list({
        status: params.status,
        q: params.q,
        skip,
        take: params.limit,
      }),
      contactRepository.countByStatus(params.q),
    ]);

    const counts: Record<ContactStatus, number> = {
      NEW: 0,
      READ: 0,
      REPLIED: 0,
      ARCHIVED: 0,
    };
    for (const row of grouped) {
      counts[row.status] = row._count._all;
    }

    return {
      items: items.map(toPublicContact),
      total,
      page: params.page,
      limit: params.limit,
      counts,
    };
  },

  /**
   * Exportação CSV do que está filtrado. Teto de 5000 linhas: acima disso o
   * ficheiro deixa de ser útil numa folha de cálculo e passa a ser um risco.
   */
  async exportCsv(params: { status?: ContactStatus; q?: string }): Promise<string> {
    const rows = await contactRepository.listForExport({
      status: params.status,
      q: params.q,
      take: 5000,
    });

    const header = [
      "Data",
      "Estado",
      "Nome",
      "Email",
      "Empresa",
      "Telefone",
      "Mensagem",
      "Nota interna",
      "Tratado em",
    ];

    const lines = rows.map((row) =>
      [
        row.createdAt.toISOString(),
        STATUS_LABELS[row.status],
        row.name,
        row.email,
        row.company ?? "",
        row.phone ?? "",
        row.message,
        row.internalNote ?? "",
        row.handledAt?.toISOString() ?? "",
      ]
        .map(csvCell)
        .join(";"),
    );

    // BOM para o Excel abrir os acentos corretamente.
    return `\uFEFF${[header.map(csvCell).join(";"), ...lines].join("\r\n")}`;
  },

  async updateNote(
    id: string,
    note: string,
    actor: AuditActor,
    ip?: string,
  ): Promise<PublicContactRequest> {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Pedido não encontrado");
    }

    if (!actor.id) {
      throw AppError.unauthorized();
    }

    const updated = await contactRepository.updateNote(id, {
      internalNote: note.trim() === "" ? null : note,
      noteUpdatedById: actor.id,
    });

    // O conteúdo da nota é interno e não vai para a auditoria.
    await auditService.record({
      actor,
      action: "contact.note_updated",
      entity: "contact",
      entityId: id,
      metadata: { hasNote: Boolean(note.trim()) },
      ip,
    });

    return toPublicContact(updated);
  },

  async updateStatus(
    id: string,
    status: ContactStatus,
    actor: AuditActor,
    ip?: string,
  ): Promise<PublicContactRequest> {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Pedido não encontrado");
    }

    const updated = await contactRepository.updateStatus(id, {
      status,
      handledById: actor.id ?? null,
      handledAt: status === "NEW" ? null : new Date(),
    });

    if (existing.status !== status) {
      await auditService.record({
        actor,
        action: "contact.status_changed",
        entity: "contact",
        entityId: id,
        metadata: {
          from: existing.status,
          to: status,
          subject: `${existing.name} <${existing.email}>`,
        },
        ip,
      });
    }

    return toPublicContact(updated);
  },
};
