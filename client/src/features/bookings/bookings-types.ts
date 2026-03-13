import { z } from "zod";

export const bookingFormSchema = z
  .object({
    checkIn: z.string().min(1, "Select a check-in date"),
    checkOut: z.string().min(1, "Select a check-out date"),
    guestCount: z.coerce.number().int().positive("Guest count must be at least 1"),
    specialNotes: z.string().trim().max(500, "Special notes must be 500 characters or less").optional(),
  })
  .refine((values) => values.checkOut > values.checkIn, {
    message: "Check-out date must be after check-in date",
    path: ["checkOut"],
  });

const decimalValueSchema = z.union([z.string(), z.number()]).transform((value) => String(value));

export const bookingSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  guestId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  totalPrice: decimalValueSchema,
  guestCount: z.number().int().positive(),
  specialNotes: z.string().nullable(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  listing: z.object({
    id: z.string(),
    title: z.string(),
    location: z.string(),
    images: z
      .array(
        z.object({
          id: z.string(),
          url: z.url(),
          alt: z.string().nullable(),
          order: z.number().int().nonnegative(),
        }),
      )
      .optional(),
  }),
});

export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type BookingFormValues = z.output<typeof bookingFormSchema>;
export type BookingRecord = z.infer<typeof bookingSchema>;
