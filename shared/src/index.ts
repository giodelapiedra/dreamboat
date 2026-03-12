import { z } from "zod";

export const roleSchema = z.enum(["GUEST", "HOST", "ADMIN"]);
export type Role = z.infer<typeof roleSchema>;

export const bookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const paymentStatusSchema = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const authUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  image: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
