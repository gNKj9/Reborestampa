import { Router } from "express";
import { auditRouter } from "./audit.routes.js";
import { authRouter } from "./auth.routes.js";
import { contactAdminRouter, contactRouter } from "./contact.routes.js";
import { healthRouter } from "./health.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/contact", contactRouter);
apiRouter.use("/contact-requests", contactAdminRouter);
apiRouter.use("/audit", auditRouter);
