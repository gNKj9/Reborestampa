import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "rb_refresh";

/**
 * Cookie de refresh token:
 * - HttpOnly  -> inacessível a JavaScript (mitiga XSS com roubo de sessão)
 * - Secure    -> só via HTTPS (obrigatório em produção)
 * - SameSite=Strict -> não acompanha pedidos cross-site (mitiga CSRF)
 * - path=/api/auth  -> só é enviado para os endpoints de autenticação
 */
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "strict",
  path: "/api/auth",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

if (isProduction && !env.COOKIE_SECURE) {
  // Não lançamos erro para permitir ambientes internos, mas isto é um erro
  // de configuração em produção — fica registado de forma bem visível.
  console.warn(
    "[segurança] COOKIE_SECURE=false com NODE_ENV=production: o refresh token viaja sem TLS.",
  );
}

export function setRefreshCookie(
  res: Response,
  token: string,
  maxAgeSeconds: number,
): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: maxAgeSeconds * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions);
}
