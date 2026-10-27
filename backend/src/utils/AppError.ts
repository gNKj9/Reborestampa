/**
 * Erro de domínio com código estável para o cliente.
 * O middleware de erros traduz isto para JSON sem expor stack traces.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Autenticação necessária"): AppError {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Sem permissões para esta operação"): AppError {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Recurso não encontrado"): AppError {
    return new AppError(404, "NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, "CONFLICT", message, details);
  }

  static unprocessable(message: string, details?: unknown): AppError {
    return new AppError(422, "UNPROCESSABLE_ENTITY", message, details);
  }

  static tooManyRequests(message = "Demasiados pedidos"): AppError {
    return new AppError(429, "TOO_MANY_REQUESTS", message);
  }

  static internal(message = "Erro interno do servidor"): AppError {
    return new AppError(500, "INTERNAL_ERROR", message);
  }
}
