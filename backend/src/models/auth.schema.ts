import { z } from "zod";
import { emailSchema, passwordSchema } from "./user.schema.js";

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Palavra-passe obrigatória").max(128),
  })
  .strict();

export const refreshSchema = z.object({}).strict();

/** Pedido de recuperação: resposta é sempre igual, exista ou não a conta. */
export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordWithTokenSchema = z
  .object({
    token: z.string().min(20, "Ligação inválida").max(200),
    newPassword: passwordSchema,
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
};
