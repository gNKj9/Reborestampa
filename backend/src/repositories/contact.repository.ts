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
  createdAt: true,
} as const;

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
    skip: number;
    take: number;
  }) {
    const where = params.status ? { status: params.status } : {};

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

  countByStatus() {
    return prisma.contactRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
  },
};
