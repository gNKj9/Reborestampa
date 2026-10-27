import { logger } from "../config/logger.js";
import type { ContactStatus } from "../models/contact.schema.js";
import {
  toPublicContact,
  type PublicContactRequest,
} from "../models/contact.schema.js";
import { contactRepository } from "../repositories/contact.repository.js";
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

    // Aviso por email em segundo plano: se falhar, o pedido já está guardado
    // e a caixa de entrada continua a ser a fonte de verdade.
    void emailService.sendContactNotification(created).catch((error: unknown) => {
      logger.warn({ err: error }, "Não foi possível enviar a notificação de contacto");
    });
  },

  async list(params: {
    status?: ContactStatus;
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
        skip,
        take: params.limit,
      }),
      contactRepository.countByStatus(),
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
