import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { loginSchema, type LoginInput } from "../models/auth.schema.js";
import { createUserSchema, type CreateUserInput } from "../models/user.schema.js";
import { authService } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from "../utils/cookies.js";

function sessionContext(req: Request) {
  return {
    userAgent: req.get("user-agent") ?? undefined,
    ipAddress: req.ip ?? undefined,
  };
}

/**
 * Controller de autenticação.
 * Contrato: o access token vai no corpo; o refresh token SÓ vai no cookie
 * HttpOnly — nunca é serializado numa resposta JSON.
 */
export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body) as LoginInput;
    const session = await authService.login(input, sessionContext(req));

    setRefreshCookie(res, session.refreshToken, env.REFRESH_TOKEN_TTL_SECONDS);

    res.status(200).json({
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      tokenType: "Bearer",
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    // Sem cookie de sessão não é um erro: é simplesmente "não autenticado".
    // Devolver 204 evita 401s de ruído na consola do browser em visitas públicas.
    if (!rawToken) {
      res.status(204).send();
      return;
    }

    const session = await authService.refresh(rawToken, sessionContext(req));

    setRefreshCookie(res, session.refreshToken, env.REFRESH_TOKEN_TTL_SECONDS);

    res.status(200).json({
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      tokenType: "Bearer",
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(rawToken);
    clearRefreshCookie(res);
    res.status(204).send();
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.auth) {
      throw AppError.unauthorized();
    }

    const user = await authService.me(req.auth.userId);
    res.status(200).json({ user });
  },

  async register(req: Request, res: Response): Promise<void> {
    const input = createUserSchema.parse(req.body) as CreateUserInput;
    const user = await authService.register(input);
    res.status(201).json({ user });
  },
};
