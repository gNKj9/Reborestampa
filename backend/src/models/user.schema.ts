import { z } from "zod";
import { roleSchema, type Role } from "./role.js";

/**
 * Contratos de entrada (validados na fronteira) e de saída (nunca incluem
 * passwordHash) para utilizadores.
 */

const passwordSchema = z
  .string()
  .min(12, "A palavra-passe deve ter pelo menos 12 caracteres")
  .max(128, "A palavra-passe não pode exceder 128 caracteres")
  .refine((value) => /[a-z]/.test(value), {
    message: "A palavra-passe deve conter letras minúsculas",
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "A palavra-passe deve conter letras maiúsculas",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "A palavra-passe deve conter algarismos",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email inválido")
  .max(255);

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Nome demasiado curto").max(120),
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema.default("VIEWER"),
  })
  .strict();

export const updateUserRoleSchema = z
  .object({
    role: roleSchema,
    isActive: z.boolean().optional(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/** Utilizador exposto pela API — sem hash, sem campos internos. */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Campos mínimos para autenticar — inclui o hash, uso interno apenas. */
export const authUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  passwordHash: true,
} as const;
