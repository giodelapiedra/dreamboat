import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import * as googleController from "./google.controller";

const router: ExpressRouter = Router();

router.get("/oauth/status", asyncHandler(googleController.getOAuthStatus));
router.get("/oauth/start", asyncHandler(googleController.startOAuth));
router.get("/oauth/callback", asyncHandler(googleController.handleOAuthCallback));

export default router;
