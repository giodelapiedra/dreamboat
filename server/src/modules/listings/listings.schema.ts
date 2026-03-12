import { z } from "zod";

const imageSchema = z.object({
  url: z.url(),
  alt: z.string().trim().max(180).optional(),
  order: z.number().int().min(0).optional(),
});

export const listingParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const createListingSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(20).max(3000),
    category: z.string().trim().min(2).max(60),
    pricePerNight: z.coerce.number().positive(),
    currency: z.string().trim().length(3).default("PHP"),
    location: z.string().trim().min(2).max(120),
    address: z.string().trim().min(5).max(200),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    maxGuests: z.number().int().positive(),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().positive(),
    amenities: z.array(z.string().trim().min(1).max(50)).max(20),
    isPublished: z.boolean().optional(),
    images: z.array(imageSchema).max(10).optional(),
  }),
});

export const updateListingSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: createListingSchema.shape.body.partial(),
});

export const availabilityQuerySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listingQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(12),
    search: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),
    sort: z
      .enum([
        "newest",
        "updated_desc",
        "updated_asc",
        "title_asc",
        "title_desc",
        "price_asc",
        "price_desc",
        "review_asc",
        "review_desc",
      ])
      .default("newest"),
    isPublished: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value === "true";
      }),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    guestCount: z.coerce.number().int().positive().optional(),
    amenities: z
      .union([z.string().min(1), z.array(z.string().min(1))])
      .optional()
      .transform((value) => {
        if (!value) {
          return undefined;
        }

        if (Array.isArray(value)) {
          return value;
        }

        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }),
    checkIn: z.iso.datetime().optional(),
    checkOut: z.iso.datetime().optional(),
  }),
});
