import { prisma } from "../config/prisma.js";

export const passwordResetRepository = {
  create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.passwordResetToken.create({
      data,
      select: { id: true, expiresAt: true },
    });
  },

  findByHash(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: { id: true, email: true, name: true, isActive: true },
        },
      },
    });
  },

  /**
   * Consome o token de forma atómica: `usedAt: null` garante que dois pedidos
   * simultâneos com o mesmo link não conseguem redefinir a palavra-passe duas
   * vezes — o segundo recebe count = 0.
   */
  claim(id: string): Promise<{ count: number }> {
    return prisma.passwordResetToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
  },

  /** Invalida pedidos anteriores do mesmo utilizador ao emitir um novo. */
  invalidatePrevious(userId: string) {
    return prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  },

  deleteExpired(reference = new Date()) {
    return prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: reference } },
    });
  },
};
