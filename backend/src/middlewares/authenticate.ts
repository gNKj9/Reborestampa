import type { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokens.js";

/** Tolerância entre o `iat` do token e a data de alteração da palavra-passe. */
const CLOCK_TOLERANCE_MS = 5_000;

/**
 * Autenticação por JWT de acesso (Authorization: Bearer).
 *
 * O token é verificado criptograficamente e depois confirmado na base de dados.
 * Esse lookup (por chave primária) é o que faz com que desativar uma conta,
 * mudar-lhe o papel ou alterar a palavra-passe tenha efeito imediato, em vez de
 * esperar que o token expire. Num painel de gestão, é o comportamento correto;
 * o custo é uma leitura indexada por pedido autenticado.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
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
    const user = await userRepository.findSessionById(payload.sub);

    if (!user || !user.isActive) {
      throw AppError.unauthorized("Conta desativada ou inexistente");
    }

    if (
      user.passwordChangedAt &&
      payload.iat * 1000 < user.passwordChangedAt.getTime() - CLOCK_TOLERANCE_MS
    ) {
      throw AppError.unauthorized(
        "Sessão terminada pela alteração da palavra-passe",
      );
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
