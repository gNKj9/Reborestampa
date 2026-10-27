import { logger } from "../config/logger.js";
import type { Prisma } from "../generated/prisma/client.js";
import { auditRepository } from "../repositories/audit.repository.js";

export type AuditEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditActor = {
  id?: string | null;
  email?: string | null;
};

/**
 * Auditoria de ações administrativas.
 *
 * Regra: registar nunca pode partir a operação. Se a escrita falhar, escreve-se
 * um erro no log e a ação continua — perder uma linha de histórico é mau,
 * bloquear uma alteração legítima por causa disso é pior.
 */
export const auditService = {
  async record(input: {
    actor?: AuditActor | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
    ip?: string | null;
  }): Promise<void> {
    try {
      await auditRepository.create({
        actorId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? null) as Prisma.InputJsonValue | null,
        ipAddress: input.ip?.replace(/^::ffff:/, "") ?? null,
      });
    } catch (error) {
      logger.error(
        { err: error, action: input.action, entity: input.entity },
        "Falha ao escrever registo de auditoria",
      );
    }
  },

  async list(params: { page: number; limit: number }): Promise<{
    items: AuditEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (params.page - 1) * params.limit;
    const { items, total } = await auditRepository.list({
      skip,
      take: params.limit,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        actorId: item.actorId,
        actorEmail: item.actorEmail,
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        metadata: (item.metadata as Record<string, unknown> | null) ?? null,
        ipAddress: item.ipAddress,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  },
};
