import { z } from "zod";
import { emailSchema } from "./user.schema.js";

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Palavra-passe obrigatória").max(128),
  })
  .strict();

export const refreshSchema = z.object({}).strict();

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
