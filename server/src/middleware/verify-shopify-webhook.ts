import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { env } from "../config/env";

export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction): void {
  const secret = env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    next();
    return;
  }

  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  if (typeof hmacHeader !== "string") {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Missing Shopify HMAC signature" });
    return;
  }

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const computedHmac = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  if (!crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(computedHmac))) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid Shopify HMAC signature" });
    return;
  }

  next();
}
