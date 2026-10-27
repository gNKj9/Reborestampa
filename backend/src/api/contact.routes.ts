import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { contactRateLimiter } from "../middlewares/rateLimit.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import {
  createContactSchema,
  updateContactNoteSchema,
  updateContactSchema,
} from "../models/contact.schema.js";
import {
  contactController,
  contactIdParamsSchema,
} from "./contact.controller.js";

/** Formulário público do site. */
export const contactRouter = Router();

contactRouter.post(
  "/",
  contactRateLimiter,
  validateBody(createContactSchema),
  contactController.create,
);

/** Caixa de entrada interna — ADMIN e EDITOR. */
export const contactAdminRouter = Router();

contactAdminRouter.use(authenticate, authorize("ADMIN", "EDITOR"));

contactAdminRouter.get("/", contactController.list);

contactAdminRouter.get("/export.csv", contactController.exportCsv);

contactAdminRouter.patch(
  "/:id/note",
  validateParams(contactIdParamsSchema),
  validateBody(updateContactNoteSchema),
  contactController.updateNote,
);

contactAdminRouter.patch(
  "/:id",
  validateParams(contactIdParamsSchema),
  validateBody(updateContactSchema),
  contactController.update,
);
