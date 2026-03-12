import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(2).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(2).default("7d"),
  SHOPIFY_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);

