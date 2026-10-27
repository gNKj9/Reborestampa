import type { Request, Response } from "express";
import { z } from "zod";
import { auditService } from "../services/audit.service.js";

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const auditController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = auditQuerySchema.parse(req.query);
    const result = await auditService.list(query);
    res.status(200).json(result);
  },
};
