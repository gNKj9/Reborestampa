import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const jsonLimitResponse = (message: string) => ({
  error: {
    code: "TOO_MANY_REQUESTS",
    message,
  },
});

/** Limite global por IP — mitiga scraping, floods e abuso genérico. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(jsonLimitResponse("Demasiados pedidos. Tenta novamente mais tarde."));
  },
});

/**
 * Limite de tentativas de login por IP + email.
 * `skipSuccessfulRequests` faz com que só falhas consumam quota, poupando
 * utilizadores legítimos e travando password spraying.
 */
export const loginRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    return `${ipKeyGenerator(req.ip ?? "unknown")}:${email}`;
  },
  handler: (_req, res) => {
    res.status(429).json(
      jsonLimitResponse(
        "Demasiadas tentativas de autenticação. Aguarda alguns minutos.",
      ),
    );
  },
});

/** Renovação de sessão: limite mais folgado, mas continua limitado. */
export const refreshRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX * 6,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
});

export function rateLimitError(): AppError {
  return AppError.tooManyRequests();
}
