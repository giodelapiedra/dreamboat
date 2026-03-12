import { z } from "zod";

export const bookingParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const createBookingSchema = z.object({
  body: z.object({
    listingId: z.string().cuid(),
    checkIn: z.iso.datetime(),
    checkOut: z.iso.datetime(),
    guestCount: z.number().int().positive(),
    specialNotes: z.string().trim().max(500).optional(),
  }),
});

