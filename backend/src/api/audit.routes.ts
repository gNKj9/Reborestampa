import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { auditController } from "./audit.controller.js";

export const auditRouter = Router();

// Histórico administrativo: só administradores.
auditRouter.use(authenticate, authorize("ADMIN"));
auditRouter.get("/", auditController.list);
