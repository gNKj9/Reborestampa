import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { resetPasswordSchema, createUserSchema, updateUserRoleSchema } from "../models/user.schema.js";
import {
  userController,
  userIdParamsSchema,
} from "./user.controller.js";

export const userRouter = Router();

// Todo o módulo de utilizadores é administrativo.
userRouter.use(authenticate, authorize("ADMIN"));

userRouter.get("/", userController.list);

userRouter.post("/", validateBody(createUserSchema), userController.create);

userRouter.get(
  "/:id",
  validateParams(userIdParamsSchema),
  userController.getById,
);

userRouter.patch(
  "/:id",
  validateParams(userIdParamsSchema),
  validateBody(updateUserRoleSchema),
  userController.update,
);

userRouter.post(
  "/:id/reset-password",
  validateParams(userIdParamsSchema),
  validateBody(resetPasswordSchema),
  userController.resetPassword,
);
