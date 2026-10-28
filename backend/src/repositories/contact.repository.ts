import { prisma } from "../config/prisma.js";
import type { ContactStatus } from "../models/contact.schema.js";

const contactSelect = {
  id: true,
  name: true,
  email: true,
  company: true,
  phone: true,
  message: true,
  status: true,
  handledAt: true,
  internalNote: true,
  noteUpdatedAt: true,
  notifyStatus: true,
  notifyError: true,
  notifiedAt: true,
  createdAt: true,
} as const;

/** Filtro de pesquisa livre: nome, email, empresa ou mensagem. */
function searchFilter(q?: string) {
  if (!q) return {};
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { name: contains },
      { email: contains },
      { company: contains },
      { message: contains },
    ],
  };
}

export const contactRepository = {
  create(data: {
    name: string;
    email: string;
    company?: string | null;
    phone?: string | null;
    message: string;
  }) {
    return prisma.contactRequest.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        message: data.message,
      },
      select: contactSelect,
    });
  },

  async list(params: {
    status?: ContactStatus;
    q?: string;
    skip: number;
    take: number;
  }) {
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...searchFilter(params.q),
    };

    const [items, total] = await prisma.$transaction([
      prisma.contactRequest.findMany({
        where,
        select: contactSelect,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.contactRequest.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.contactRequest.findUnique({
      where: { id },
      select: contactSelect,
    });
  },

  updateStatus(
    id: string,
    data: { status: ContactStatus; handledById: string | null; handledAt: Date | null },
  ) {
    return prisma.contactRequest.update({
      where: { id },
      data,
      select: contactSelect,
    });
  },

  countByStatus(q?: string) {
    return prisma.contactRequest.groupBy({
      by: ["status"],
      where: searchFilter(q),
      _count: { _all: true },
    });
  },

  /** Exportação: sem paginação, com teto de segurança. */
  listForExport(params: { status?: ContactStatus; q?: string; take: number }) {
    return prisma.contactRequest.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...searchFilter(params.q),
      },
      select: contactSelect,
      orderBy: { createdAt: "desc" },
      take: params.take,
    });
  },

  setNotifyStatus(
    id: string,
    status: "SENT" | "FAILED" | "DISABLED",
    error?: string | null,
  ) {
    return prisma.contactRequest.update({
      where: { id },
      data: {
        notifyStatus: status,
        notifyError: error ? error.slice(0, 300) : null,
        notifiedAt: status === "SENT" ? new Date() : null,
      },
      select: { id: true },
    });
  },

  updateNote(
    id: string,
    data: { internalNote: string | null; noteUpdatedById: string },
  ) {
    return prisma.contactRequest.update({
      where: { id },
      data: { ...data, noteUpdatedAt: new Date() },
      select: contactSelect,
    });
  },
};
