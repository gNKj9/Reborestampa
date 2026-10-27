import type { Role } from "../models/role.js";

/**
 * Aumenta o tipo Request do Express com o contexto injetado pelos middlewares.
 * Evita `any` espalhado pelos controllers.
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
