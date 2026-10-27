import { prisma } from "../config/prisma.js";
import type { Role } from "../models/role.js";
import { authUserSelect } from "../models/user.schema.js";

/** Campos seguros (sem passwordHash) usados nas respostas da API. */
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

/**
 * Data Access Layer de utilizadores.
 * É a única camada que fala com o Prisma para este agregado; os serviços nunca
 * constroem queries. Todos os acessos são parametrizados pelo Prisma.
 */
export const userRepository = {
  findByEmailWithHash(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  },

  findPublicById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  },

  findPublicByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  },

  async list(params: { skip: number; take: number }) {
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: publicUserSelect,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.user.count(),
    ]);

    return { items, total };
  },

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }) {
    return prisma.user.create({
      data,
      select: publicUserSelect,
    });
  },

  updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: publicUserSelect,
    });
  },

  updateAccess(
    id: string,
    data: { role?: Role; isActive?: boolean },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  },
};
