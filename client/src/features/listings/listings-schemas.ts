import { z } from "zod";

export const listingFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(3000),
  category: z.string().trim().min(2, "Category is required").max(60),
  pricePerNight: z.coerce.number().positive("Nightly rate must be greater than 0"),
  currency: z.string().trim().length(3, "Use a 3-letter currency code").default("PHP"),
  location: z.string().trim().min(2, "Location is required").max(120),
  address: z.string().trim().min(5, "Address is required").max(200),
  maxGuests: z.coerce.number().int().positive("Guest capacity must be at least 1"),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms cannot be negative"),
  bathrooms: z.coerce.number().positive("Bathrooms must be greater than 0"),
  amenitiesText: z.string().trim().min(1, "Add at least one amenity"),
  imageUrlsText: z.string().trim().optional(),
  isPublished: z.boolean().default(false),
});

export const listingFilterSchema = z.object({
  search: z.string().default(""),
  location: z.string().default(""),
  category: z.string().default(""),
  minPrice: z.string().default(""),
  maxPrice: z.string().default(""),
  guestCount: z.string().default(""),
  checkIn: z.string().default(""),
  checkOut: z.string().default(""),
  amenities: z.string().default(""),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;
export type ListingFilterValues = z.infer<typeof listingFilterSchema>;
