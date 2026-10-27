import "dotenv/config";
import { z } from "zod";

/**
 * Validação estrita das variáveis de ambiente.
 * A aplicação recusa arrancar com configuração inválida ou insegura:
 * falhar no boot é preferível a correr com defaults silenciosos.
 */

const booleanFromString = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const corsOrigins = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .refine(
    (origins) =>
      origins.length > 0 &&
      origins.every((origin) => /^https?:\/\/[^\s/]+$/.test(origin)),
    { message: "CORS_ORIGINS deve listar origens http(s) separadas por vírgulas" },
  );

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z
    .string()
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      message: "DATABASE_URL deve ser um URI postgresql://",
    }),

  CORS_ORIGINS: corsOrigins,
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET deve ter pelo menos 32 caracteres"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(604_800),
  JWT_ISSUER: z.string().min(1).default("reborestampa-api"),
  JWT_AUDIENCE: z.string().min(1).default("reborestampa-web"),

  COOKIE_DOMAIN: z.string().min(1).optional(),
  COOKIE_SECURE: booleanFromString.default(false),

  /** Serve o build estático do frontend (modo single-origin / PaaS). */
  SERVE_STATIC: booleanFromString.default(false),
  STATIC_DIR: z.string().min(1).default("./web"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(900_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  /** Notificação de novos pedidos por email (opcional). */
  RESEND_API_KEY: z.string().min(10).optional(),
  CONTACT_NOTIFY_TO: z.string().email().default("reborestampa@gmail.com"),
  CONTACT_NOTIFY_FROM: z
    .string()
    .min(3)
    .default("Reborestampa <onboarding@resend.dev>"),
  PUBLIC_SITE_URL: z.string().url().default("https://reborestampa.onrender.com"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export const envSchema = rawEnvSchema.superRefine((value, ctx) => {
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["JWT_REFRESH_SECRET"],
      message:
        "JWT_REFRESH_SECRET tem de ser diferente de JWT_ACCESS_SECRET (chaves separadas por tipo de token)",
    });
  }
});

const parsed = envSchema.safeParse(
  // Variáveis declaradas mas vazias (`COOKIE_DOMAIN=`) chegam como "". São
  // tratadas como ausentes: caso contrário falhavam validações de mínimo.
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([, value]) => value === undefined || value.trim() !== "",
    ),
  ),
);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Configuração inválida. Corrige o ficheiro .env (ver .env.example):\n${issues}`,
  );
}

export const env = Object.freeze(parsed.data);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/**
 * Proteção contra o erro mais fácil de cometer: levar os segredos de exemplo
 * do .env.example para produção. Em desenvolvimento avisa; em produção recusa.
 */
const PLACEHOLDER_SECRET = /^troca-por-/;

if (
  PLACEHOLDER_SECRET.test(env.JWT_ACCESS_SECRET) ||
  PLACEHOLDER_SECRET.test(env.JWT_REFRESH_SECRET)
) {
  const message =
    "Os segredos JWT ainda são os valores de exemplo. Gera segredos próprios (ver README) antes de expor a API.";
  if (isProduction) {
    throw new Error(message);
  }
  console.warn(`[segurança] ${message}`);
}
