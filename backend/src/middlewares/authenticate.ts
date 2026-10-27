import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokens.js";

/**
 * Autenticação stateless via JWT de acesso (Authorization: Bearer <token>).
 * O token de acesso é curto (15 min por omissão) e não é aceite a partir de
 * cookies, o que impede CSRF em endpoints que alteram estado.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(AppError.unauthorized("Token de acesso em falta"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next(AppError.unauthorized("Token de acesso em falta"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
