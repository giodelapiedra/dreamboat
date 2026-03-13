import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { validate } from "../../middleware/validate";
import { verifyShopifyWebhook } from "../../middleware/verify-shopify-webhook";
import * as formSystemController from "./form-system.controller";
import { shopifyWebhookSchema } from "./form-system.schema";

const router: ExpressRouter = Router();

// Original endpoint (manual/structured payload)
router.post(
  "/shopify",
  verifyShopifyWebhook,
  validate(shopifyWebhookSchema),
  asyncHandler(formSystemController.handleShopifyWebhook),
);

// Raw Shopify orders/paid webhook (auto-parses product title + variant)
router.post(
  "/shopify/raw",
  verifyShopifyWebhook,
  asyncHandler(formSystemController.handleShopifyRawWebhook),
);

export default router;
