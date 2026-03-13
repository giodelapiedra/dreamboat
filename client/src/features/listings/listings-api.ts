import type { ApiSuccessResponse } from "@/lib/api/types";
import { apiClient, rawHttpClient } from "@/lib/api/client";

import {
  availabilityEntrySchema,
  listingDetailSchema,
  listingSummarySchema,
  type AvailabilityEntry,
  type ListingDetail,
  type ListingFilters,
  type ListingSummary,
} from "./listings-types";

interface PaginatedListings {
  data: ListingSummary[];
  meta?: ApiSuccessResponse<ListingSummary[]>["meta"];
}

export interface UpsertListingInput {
  title: string;
  description: string;
  category: string;
  pricePerNight: number;
  currency: string;
  location: string;
  address: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  isPublished: boolean;
  images?: Array<{ url: string; alt?: string; order?: number }>;
}

function buildParams(filters: ListingFilters): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params[key] = value.join(",");
      }
      continue;
    }

    params[key] = value;
  }

  return params;
}

export async function listPublicListings(filters: ListingFilters): Promise<PaginatedListings> {
  const response = await rawHttpClient.get<ApiSuccessResponse<unknown>>("/listings", {
    params: buildParams(filters),
  });

  return {
    data: listingSummarySchema.array().parse(response.data.data),
    meta: response.data.meta,
  };
}

export async function listManagedListings(filters: ListingFilters): Promise<PaginatedListings> {
  const response = await apiClient.get<ApiSuccessResponse<unknown>>("/listings", {
    params: buildParams(filters),
  });

  return {
    data: listingSummarySchema.array().parse(response.data.data),
    meta: response.data.meta,
  };
}

export async function getPublicListingById(listingId: string): Promise<ListingDetail> {
  const response = await rawHttpClient.get<ApiSuccessResponse<unknown>>(`/listings/${listingId}`);
  return listingDetailSchema.parse(response.data.data);
}

export async function getAvailability(listingId: string): Promise<AvailabilityEntry[]> {
  const response = await rawHttpClient.get<ApiSuccessResponse<unknown>>(
    `/listings/${listingId}/availability`,
  );
  return availabilityEntrySchema.array().parse(response.data.data);
}

export async function createListing(input: UpsertListingInput): Promise<void> {
  await apiClient.post<ApiSuccessResponse<unknown>>("/listings", input);
}

export async function updateListing(
  listingId: string,
  input: Partial<UpsertListingInput>,
): Promise<void> {
  await apiClient.patch<ApiSuccessResponse<unknown>>(`/listings/${listingId}`, input);
}

export async function deleteListing(listingId: string): Promise<void> {
  await apiClient.delete(`/listings/${listingId}`);
}
