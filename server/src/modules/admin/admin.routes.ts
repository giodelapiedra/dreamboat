import { Router, type Router as ExpressRouter } from "express";
import { StatusCodes } from "http-status-codes";

import { authenticate, authorize } from "../../middleware/auth";

const router: ExpressRouter = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Admin reporting is reserved for a later phase",
  });
});

router.patch("/users/:id/role", (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Role management is reserved for a later phase",
  });
});

router.get("/stats", (_req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    error: "Not implemented",
    message: "Admin stats are reserved for a later phase",
  });
});

export default router;


