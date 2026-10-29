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

/**
 * Segunda barreira, só por IP: sem ela, variar o email a cada tentativa
 * escaparia ao limite anterior e permitiria password spraying distribuído
 * por muitas contas a partir da mesma origem.
 */
export const loginIpRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX * 2,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: (_req, res) => {
    res.status(429).json(
      jsonLimitResponse(
        "Demasiadas tentativas de autenticação a partir desta rede. Aguarda alguns minutos.",
      ),
    );
  },
});

/**
 * Segunda barreira, só por IP: sem ela, variar o email a cada pedido escaparia
 * ao limite por email e permitiria inundar muitas caixas a partir da mesma origem.
 */
export const forgotPasswordIpRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: (_req, res) => {
    res.status(429).json(
      jsonLimitResponse(
        "Demasiados pedidos de recuperação a partir desta rede. Aguarda alguns minutos.",
      ),
    );
  },
});

/**
 * Recuperação de palavra-passe: poucos pedidos por IP e por email. Sem isto,
 * o formulário serve para inundar a caixa de alguém com links.
 */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    return `${ipKeyGenerator(req.ip ?? "unknown")}:${email}`;
  },
  handler: (_req, res) => {
    res.status(429).json(
      jsonLimitResponse(
        "Demasiados pedidos de recuperação. Aguarda alguns minutos.",
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

/**
 * Formulário público de contacto: poucos pedidos por IP e por janela.
 * Um humano escreve uma vez; um bot escreve cem.
 */
export const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: (_req, res) => {
    res
      .status(429)
      .json(
        jsonLimitResponse(
          "Demasiados pedidos. Aguarda alguns minutos antes de voltar a escrever.",
        ),
      );
  },
});

export function rateLimitError(): AppError {
  return AppError.tooManyRequests();
}
