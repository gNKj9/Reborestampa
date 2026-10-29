import { Router } from "express";
import { validateBody } from "../middlewares/validate.js";
import {
  forgotPasswordRateLimiter,
  loginIpRateLimiter,
  loginRateLimiter,
  refreshRateLimiter,
} from "../middlewares/rateLimit.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { loginSchema } from "../models/auth.schema.js";
import { changePasswordSchema, createUserSchema } from "../models/user.schema.js";
import {
  forgotPasswordSchema,
  resetPasswordWithTokenSchema,
} from "../models/auth.schema.js";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  loginIpRateLimiter,
  loginRateLimiter,
  validateBody(loginSchema),
  authController.login,
);

authRouter.post("/refresh", refreshRateLimiter, authController.refresh);

/** Recuperação de palavra-passe: público, com limite próprio. */
authRouter.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);

authRouter.post(
  "/reset-password",
  refreshRateLimiter,
  validateBody(resetPasswordWithTokenSchema),
  authController.resetPassword,
);

authRouter.post("/logout", authController.logout);

authRouter.get("/me", authenticate, authController.me);

/** Alteração da própria palavra-passe. */
authRouter.patch(
  "/password",
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword,
);

/** Criação de contas é administrativa: não há registo público. */
authRouter.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  validateBody(createUserSchema),
  authController.register,
);
