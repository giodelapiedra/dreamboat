import { Router, type Router as ExpressRouter } from "express";
import { StatusCodes } from "http-status-codes";

import { authenticate } from "../../middleware/auth";

const router: ExpressRouter = Router();

router.post("/checkout", authenticate, (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Stripe checkout is reserved for the payments phase",
  });
});

router.post("/webhook", (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Stripe webhook handling is reserved for the payments phase",
  });
});

export default router;


