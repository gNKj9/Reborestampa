import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const HEADER = "x-request-id";

/**
 * Correlation id por pedido. Aceita-se o header do proxy (para tracing
 * distribuído) mas valida-se o formato para não injetar lixo nos logs.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header(HEADER);
  const valid = incoming && /^[A-Za-z0-9._-]{8,64}$/.test(incoming);
  req.requestId = valid ? incoming : randomUUID();
  res.setHeader(HEADER, req.requestId);
  next();
}
