import type { Role } from "../models/role.js";
import { toPublicUser, type PublicUser } from "../models/user.schema.js";
import { refreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword } from "../utils/password.js";

export const userService = {
  async list(params: {
    page: number;
    limit: number;
  }): Promise<{ items: PublicUser[]; total: number; page: number; limit: number }> {
    const skip = (params.page - 1) * params.limit;
    const { items, total } = await userRepository.list({
      skip,
      take: params.limit,
    });

    return {
      items: items.map(toPublicUser),
      total,
      page: params.page,
      limit: params.limit,
    };
  },

  async getById(id: string): Promise<PublicUser> {
    const user = await userRepository.findPublicById(id);
    if (!user) {
      throw AppError.notFound("Utilizador não encontrado");
    }
    return toPublicUser(user);
  },

  /**
   * Alteração de papel/estado por um administrador.
   * Duas travas: ninguém muda o seu próprio papel e o sistema nunca fica sem
   * administradores ativos — seria um bloqueio sem recuperação pela interface.
   */
  async updateAccess(
    id: string,
    input: { role?: Role; isActive?: boolean },
    actorId: string,
  ): Promise<PublicUser> {
    const existing = await userRepository.findPublicById(id);
    if (!existing) {
      throw AppError.notFound("Utilizador não encontrado");
    }

    if (id === actorId && input.role && input.role !== existing.role) {
      throw AppError.badRequest("Não podes alterar o teu próprio papel");
    }

    const losesAdmin =
      existing.role === "ADMIN" &&
      ((input.role !== undefined && input.role !== "ADMIN") ||
        input.isActive === false);

    if (losesAdmin) {
      const remaining = await userRepository.countActiveAdmins(id);
      if (remaining === 0) {
        throw AppError.badRequest(
          "Tem de existir pelo menos um administrador ativo",
        );
      }
    }

    const updated = await userRepository.updateAccess(id, input);
    return toPublicUser(updated);
  },

  /**
   * Reposição por administrador. Não é possível fazer isto à própria conta —
   * para a própria, usa-se a alteração normal, que exige a palavra-passe atual.
   */
  async resetPassword(
    id: string,
    newPassword: string,
    actorId: string,
  ): Promise<PublicUser> {
    if (id === actorId) {
      throw AppError.badRequest(
        "Para a tua conta, altera a palavra-passe na página de conta",
      );
    }

    const existing = await userRepository.findPublicById(id);
    if (!existing) {
      throw AppError.notFound("Utilizador não encontrado");
    }

    const passwordHash = await hashPassword(newPassword);
    const updated = await userRepository.updatePassword(id, passwordHash);

    // Reposição administrativa invalida todas as sessões dessa conta.
    await refreshTokenRepository.revokeAllForUser(id);

    return toPublicUser(updated);
  },
};
