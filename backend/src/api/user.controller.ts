import type { Request, Response } from "express";
import { z } from "zod";
import {
  createUserSchema,
  updateUserRoleSchema,
} from "../models/user.schema.js";
import { userService } from "../services/user.service.js";
import { AppError } from "../utils/AppError.js";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParamsSchema = z.object({
  id: z.uuid("Identificador inválido"),
});

export const userController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await userService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    const user = await userService.getById(req.params.id);
    res.status(200).json({ user });
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    const input = updateUserRoleSchema.parse(req.body);

    // Um ADMIN não se pode desativar a si próprio (evita ficar sem acesso).
    if (req.auth?.userId === req.params.id && input.isActive === false) {
      throw AppError.badRequest("Não podes desativar a tua própria conta");
    }

    const user = await userService.updateAccess(req.params.id, input);
    res.status(200).json({ user });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createUserSchema.parse(req.body);
    const { authService } = await import("../services/auth.service.js");
    const user = await authService.register(input);
    res.status(201).json({ user });
  },
};
