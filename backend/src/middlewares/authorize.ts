import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "../models/role.js";
import { AppError } from "../utils/AppError.js";

/**
 * RBAC: cada rota declara os papéis autorizados.
 * Sem `req.auth` é 401 (não autenticado); com papel errado é 403.
 */
export function authorize(...allowed: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(AppError.unauthorized());
      return;
    }

    if (!allowed.includes(req.auth.role)) {
      next(AppError.forbidden("O teu papel não permite esta operação"));
      return;
    }

    next();
  };
}
