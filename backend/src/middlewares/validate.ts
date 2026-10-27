import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { AppError } from "../utils/AppError.js";

function formatIssues(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(payload)",
    message: issue.message,
  }));
}

/**
 * Validação de entrada na fronteira. O resultado substitui o valor original:
 * campos desconhecidos são removidos pelos schemas `.strict()` e o resto da
 * aplicação só vê dados já validados e tipados.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body ?? {});
      next();
    } catch (error) {
      next(toValidationError(error));
    }
  };
}

export function validateParams(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as Request["params"];
      next();
    } catch (error) {
      next(toValidationError(error));
    }
  };
}

export function validateQuery(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Express 5 expõe a query como getter; substituímos por um objeto plano.
      Object.defineProperty(req, "query", {
        value: schema.parse(req.query),
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error) {
      next(toValidationError(error));
    }
  };
}

function toValidationError(error: unknown): AppError {
  if (error instanceof ZodError) {
    return AppError.unprocessable("Dados de entrada inválidos", formatIssues(error));
  }
  return error instanceof AppError ? error : AppError.internal();
}
