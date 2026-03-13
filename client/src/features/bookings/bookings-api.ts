import type { ApiSuccessResponse } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

import { bookingSchema, type BookingRecord } from "./bookings-types";

interface CreateBookingInput {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  specialNotes?: string;
}

export async function getMyBookings(): Promise<BookingRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<unknown>>("/bookings");
  return bookingSchema.array().parse(response.data.data);
}

export async function createBooking(input: CreateBookingInput): Promise<BookingRecord> {
  const response = await apiClient.post<ApiSuccessResponse<unknown>>("/bookings", input);
  const data = response.data.data as Record<string, unknown>;
  const listing = (data.listing as Record<string, unknown> | undefined) ?? {};

  return bookingSchema.parse({
    ...data,
    listing: {
      ...listing,
      images: [],
    },
  });
}

export async function cancelBooking(bookingId: string): Promise<BookingRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<unknown>>(`/bookings/${bookingId}/cancel`);
  const data = response.data.data as Record<string, unknown>;
  const listing = (data.listing as Record<string, unknown> | undefined) ?? {};

  return bookingSchema.parse({
    ...data,
    listing: {
      ...listing,
      images: [],
    },
  });
}
