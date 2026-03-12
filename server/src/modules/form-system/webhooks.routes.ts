import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { validate } from "../../middleware/validate";
import { verifyShopifyWebhook } from "../../middleware/verify-shopify-webhook";
import * as formSystemController from "./form-system.controller";
import { shopifyWebhookSchema } from "./form-system.schema";

const router: ExpressRouter = Router();

router.post(
  "/shopify",
  verifyShopifyWebhook,
  validate(shopifyWebhookSchema),
  asyncHandler(formSystemController.handleShopifyWebhook),
);

export default router;
