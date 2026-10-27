import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

const auditSelect = {
  id: true,
  actorId: true,
  actorEmail: true,
  action: true,
  entity: true,
  entityId: true,
  metadata: true,
  ipAddress: true,
  createdAt: true,
} as const;

export const auditRepository = {
  create(data: {
    actorId?: string | null;
    actorEmail?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue | null;
    ipAddress?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId ?? null,
        actorEmail: data.actorEmail ?? null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        metadata: data.metadata ?? undefined,
        ipAddress: data.ipAddress?.slice(0, 45) ?? null,
      },
      select: auditSelect,
    });
  },

  async list(params: { skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        select: auditSelect,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.auditLog.count(),
    ]);

    return { items, total };
  },
};
