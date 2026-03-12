import { Router, type Router as ExpressRouter } from "express";
import { StatusCodes } from "http-status-codes";

import { authenticate } from "../../middleware/auth";

const router: ExpressRouter = Router({ mergeParams: true });

router.get("/", (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Review APIs are reserved for a later phase",
  });
});

router.post("/", authenticate, (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Review creation is reserved for a later phase",
  });
});

export default router;


