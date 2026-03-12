import { Router, type Router as ExpressRouter } from "express";
import { StatusCodes } from "http-status-codes";

import { authenticate } from "../../middleware/auth";

const router: ExpressRouter = Router();

router.post("/", authenticate, (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "File upload is reserved for the media phase",
  });
});

export default router;


