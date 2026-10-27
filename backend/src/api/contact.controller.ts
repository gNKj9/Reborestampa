import type { Request, Response } from "express";
import { z } from "zod";
import {
  createContactSchema,
  listContactsQuerySchema,
  updateContactNoteSchema,
  updateContactSchema,
} from "../models/contact.schema.js";
import { contactService } from "../services/contact.service.js";
import { AppError } from "../utils/AppError.js";

export const contactIdParamsSchema = z.object({
  id: z.uuid("Identificador inválido"),
});

export const contactController = {
  /** Público. Responde sempre 201, mesmo quando o honeypot descarta o pedido. */
  async create(req: Request, res: Response): Promise<void> {
    const input = createContactSchema.parse(req.body);
    await contactService.create(input, { ipAddress: req.ip ?? undefined });
    res.status(201).json({ ok: true });
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = listContactsQuerySchema.parse(req.query);
    const result = await contactService.list(query);
    res.status(200).json(result);
  },

  /** CSV do que está filtrado (estado + pesquisa), com BOM para Excel. */
  async exportCsv(req: Request, res: Response): Promise<void> {
    const query = listContactsQuerySchema.parse(req.query);
    const csv = await contactService.exportCsv({
      status: query.status,
      q: query.q,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.status(200).send(csv);
  },

  async updateNote(req: Request<{ id: string }>, res: Response): Promise<void> {
    if (!req.auth) {
      throw AppError.unauthorized();
    }

    const input = updateContactNoteSchema.parse(req.body);
    const request = await contactService.updateNote(
      req.params.id,
      input.note,
      { id: req.auth.userId, email: req.auth.email },
      req.ip,
    );

    res.status(200).json({ request });
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const input = updateContactSchema.parse(req.body);
    const request = await contactService.updateStatus(
      req.params.id,
      input.status,
      { id: req.auth.userId, email: req.auth.email },
      req.ip,
    );
    res.status(200).json({ request });
  },
};
