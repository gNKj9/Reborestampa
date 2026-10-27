import type { Role } from "../models/role.js";
import { toPublicUser, type PublicUser } from "../models/user.schema.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/AppError.js";

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

  async updateAccess(
    id: string,
    input: { role?: Role; isActive?: boolean },
  ): Promise<PublicUser> {
    const existing = await userRepository.findPublicById(id);
    if (!existing) {
      throw AppError.notFound("Utilizador não encontrado");
    }

    const updated = await userRepository.updateAccess(id, input);
    return toPublicUser(updated);
  },
};
