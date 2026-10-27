import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

type PrismaLikeError = {
  code?: unknown;
  clientVersion?: unknown;
  meta?: unknown;
};

function isPrismaKnownError(error: unknown): error is PrismaLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as PrismaLikeError).code === "string" &&
    String((error as PrismaLikeError).code).startsWith("P")
  );
}

/**
 * Tratamento central de erros.
 * - Erros de domínio (AppError) devolvem código estável e mensagem segura.
 * - Erros do Prisma são traduzidos sem expor detalhes da base de dados.
 * - Tudo o resto é 500 genérico; o detalhe fica apenas no log.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  const requestId = req.requestId;

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(
        { err: error, requestId, path: req.originalUrl },
        "Erro de aplicação",
      );
    }
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
        requestId,
      },
    });
    return;
  }

  if (isPrismaKnownError(error)) {
    const code = String(error.code);

    if (code === "P2002") {
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "Já existe um registo com estes dados.",
          requestId,
        },
      });
      return;
    }

    if (code === "P2025") {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Recurso não encontrado.",
          requestId,
        },
      });
      return;
    }

    logger.error(
      { err: error, requestId, path: req.originalUrl },
      "Erro do Prisma não mapeado",
    );
  } else {
    logger.error(
      { err: error, requestId, path: req.originalUrl },
      "Erro não tratado",
    );
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocorreu um erro inesperado.",
      requestId,
    },
    ...(isProduction ? {} : { debug: error instanceof Error ? error.message : String(error) }),
  });
}
