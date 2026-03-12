import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import * as authController from "./auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schema";

const router: ExpressRouter = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;


