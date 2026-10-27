import { z } from "zod";
import { emailSchema } from "./user.schema.js";

export const CONTACT_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const contactStatusSchema = z.enum(CONTACT_STATUSES);

/**
 * Formulário público. `website` é um honeypot: humanos não o vêem, bots
 * preenchem-no e o pedido é descartado sem erro (não damos pistas).
 */
export const createContactSchema = z
  .object({
    name: z.string().trim().min(2, "Indica o teu nome").max(120),
    email: emailSchema,
    company: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(40).optional(),
    message: z
      .string()
      .trim()
      .min(10, "Escreve pelo menos 10 caracteres")
      .max(2000, "Máximo 2000 caracteres"),
    website: z.string().max(200).optional(),
  })
  .strict();

export const updateContactSchema = z
  .object({
    status: contactStatusSchema,
  })
  .strict();

export const listContactsQuerySchema = z.object({
  status: contactStatusSchema.optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Nota interna: vazia limpa a nota. */
export const updateContactNoteSchema = z
  .object({
    note: z.string().trim().max(2000, "Máximo 2000 caracteres"),
  })
  .strict();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type UpdateContactNoteInput = z.infer<typeof updateContactNoteSchema>;

export type PublicContactRequest = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  status: ContactStatus;
  handledAt: string | null;
  internalNote: string | null;
  noteUpdatedAt: string | null;
  createdAt: string;
};

type ContactRecord = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  status: ContactStatus;
  handledAt: Date | null;
  internalNote: string | null;
  noteUpdatedAt: Date | null;
  createdAt: Date;
};

export function toPublicContact(request: ContactRecord): PublicContactRequest {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    company: request.company,
    phone: request.phone,
    message: request.message,
    status: request.status,
    handledAt: request.handledAt?.toISOString() ?? null,
    internalNote: request.internalNote,
    noteUpdatedAt: request.noteUpdatedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
  };
}
