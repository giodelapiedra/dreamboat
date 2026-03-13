import { z } from "zod";

const decimalValueSchema = z.union([z.string(), z.number()]).transform((value) => String(value));

const imageSchema = z.object({
  id: z.string(),
  url: z.url(),
  alt: z.string().nullable(),
  order: z.number().int().nonnegative(),
});

const hostSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
});

const reviewSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string().datetime(),
  authorId: z.string(),
  listingId: z.string(),
  author: hostSummarySchema,
});

export const listingSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  pricePerNight: decimalValueSchema,
  currency: z.string(),
  location: z.string(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  maxGuests: z.number().int().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number(),
  amenities: z.array(z.string()),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  hostId: z.string(),
  host: hostSummarySchema,
  images: z.array(imageSchema),
  reviews: z.array(z.object({ rating: z.number().int().min(1).max(5) })),
  averageRating: z.number().nullable(),
  reviewCount: z.number().int().nonnegative(),
});

export const listingDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  pricePerNight: decimalValueSchema,
  currency: z.string(),
  location: z.string(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  maxGuests: z.number().int().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number(),
  amenities: z.array(z.string()),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  hostId: z.string(),
  host: hostSummarySchema,
  images: z.array(imageSchema),
  reviews: z.array(reviewSchema),
  averageRating: z.number().nullable(),
});

export const availabilityEntrySchema = z.object({
  id: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export interface ListingFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
  sort?:
    | "newest"
    | "updated_desc"
    | "updated_asc"
    | "title_asc"
    | "title_desc"
    | "price_asc"
    | "price_desc"
    | "review_asc"
    | "review_desc";
  isPublished?: boolean;
  minPrice?: number;
  maxPrice?: number;
  guestCount?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
}

export type ListingSummary = z.infer<typeof listingSummarySchema>;
export type ListingDetail = z.infer<typeof listingDetailSchema>;
export type AvailabilityEntry = z.infer<typeof availabilityEntrySchema>;
