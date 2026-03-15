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
    const msg = "Missing Shopify HMAC signature";
    res.status(StatusCodes.UNAUTHORIZED).json({ error: msg });
    return;
  }

  const raw = (req as any).rawBody;
  const body = raw ?? JSON.stringify(req.body);
  const computed = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  const a = Buffer.from(hmacHeader);
  const b = Buffer.from(computed);

  if (!crypto.timingSafeEqual(a, b)) {
    const msg = "Invalid Shopify HMAC signature";
    res.status(StatusCodes.UNAUTHORIZED).json({ error: msg });
    return;
  }

  next();
}
