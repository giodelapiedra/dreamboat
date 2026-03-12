import { Router, type Router as ExpressRouter } from "express";

import { successResponse } from "../common/api-response";

const router: ExpressRouter = Router();

router.get("/", (_req, res) => {
  res.json(
    successResponse({
      name: "dreamboat-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  );
});

export default router;


