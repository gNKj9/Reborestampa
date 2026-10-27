import { Router } from "express";
import { validateBody } from "../middlewares/validate.js";
import { loginRateLimiter, refreshRateLimiter } from "../middlewares/rateLimit.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { loginSchema } from "../models/auth.schema.js";
import { createUserSchema } from "../models/user.schema.js";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  authController.login,
);

authRouter.post("/refresh", refreshRateLimiter, authController.refresh);

authRouter.post("/logout", authController.logout);

authRouter.get("/me", authenticate, authController.me);

/** Criação de contas é administrativa: não há registo público. */
authRouter.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  validateBody(createUserSchema),
  authController.register,
);
