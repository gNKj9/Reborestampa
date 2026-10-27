import { prisma } from "../config/prisma.js";
import { authUserSelect } from "../models/user.schema.js";

type CreateRefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

/**
 * Data Access Layer de refresh tokens.
 * Nunca guardamos o token em claro — apenas o SHA-256.
 */
export const refreshTokenRepository = {
  create(data: CreateRefreshToken) {
    return prisma.refreshToken.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent?.slice(0, 255) ?? null,
        ipAddress: data.ipAddress?.slice(0, 45) ?? null,
      },
      select: { id: true, expiresAt: true },
    });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: { select: authUserSelect },
      },
    });
  },

  /**
   * Rotação atómica: revoga o token atual e emite o novo na mesma transação.
   * `updateMany` com `revokedAt: null` garante que dois pedidos concorrentes
   * não conseguem trocar o mesmo token — o segundo recebe count = 0.
   */
  rotate(params: {
    currentId: string;
    newId: string;
    newHash: string;
    newExpiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: params.currentId, revokedAt: null },
        data: { revokedAt: new Date(), replacedByTokenId: params.newId },
      });

      if (revoked.count === 0) {
        return false;
      }

      const current = await tx.refreshToken.findUnique({
        where: { id: params.currentId },
        select: { userId: true },
      });

      if (!current) {
        return false;
      }

      await tx.refreshToken.create({
        data: {
          id: params.newId,
          userId: current.userId,
          tokenHash: params.newHash,
          expiresAt: params.newExpiresAt,
          userAgent: params.userAgent?.slice(0, 255) ?? null,
          ipAddress: params.ipAddress?.slice(0, 45) ?? null,
        },
      });

      return true;
    });
  },

  revoke(id: string) {
    return prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  revokeByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /**
   * Usado na deteção de reutilização e ao mudar a palavra-passe: mata toda a
   * família de tokens. `exceptTokenHash` mantém viva a sessão que fez o pedido.
   */
  revokeAllForUser(userId: string, exceptTokenHash?: string) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptTokenHash ? { tokenHash: { not: exceptTokenHash } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  },

  deleteExpired(reference = new Date()) {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: reference } },
    });
  },
};
