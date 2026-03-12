import { BookingStatus, Prisma } from "../../../generated/prisma";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../../lib/http-error";
import { prisma } from "../../lib/prisma";

function calculateNights(checkIn: Date, checkOut: Date): number {
  const durationMs = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
}

function assertBookableDates(checkIn: Date, checkOut: Date): void {
  if (checkOut <= checkIn) {
    throw new HttpError(
      StatusCodes.BAD_REQUEST,
      "Check-out date must be after check-in date",
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    throw new HttpError(
      StatusCodes.BAD_REQUEST,
      "Check-in date must be in the future",
    );
  }
}

async function assertBookingOwner(bookingId: string, userId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
    },
  });

  if (!booking) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Booking not found");
  }

  if (booking.guestId !== userId) {
    throw new HttpError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to access this booking",
    );
  }
}

export async function getMine(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      guestId: userId,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          images: {
            orderBy: { order: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return bookings.map((booking) => ({
    ...booking,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  }));
}

export async function getById(bookingId: string, userId: string) {
  await assertBookingOwner(bookingId, userId);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Booking not found");
  }

  return {
    ...booking,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export async function create(
  userId: string,
  input: {
    listingId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    specialNotes?: string;
  },
) {
  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);

  assertBookableDates(checkInDate, checkOutDate);

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      pricePerNight: true,
      maxGuests: true,
      isPublished: true,
      currency: true,
    },
  });

  if (!listing || !listing.isPublished) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  if (input.guestCount > listing.maxGuests) {
    throw new HttpError(
      StatusCodes.BAD_REQUEST,
      "Guest count exceeds the listing capacity",
    );
  }

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      listingId: input.listingId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
      checkIn: {
        lt: checkOutDate,
      },
      checkOut: {
        gt: checkInDate,
      },
    },
    select: { id: true },
  });

  if (overlappingBooking) {
    throw new HttpError(
      StatusCodes.CONFLICT,
      "Selected dates are no longer available",
    );
  }

  const nights = calculateNights(checkInDate, checkOutDate);

  if (nights < 1) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "Booking must be at least 1 night");
  }

  const totalPrice = listing.pricePerNight.mul(new Prisma.Decimal(nights));

  const booking = await prisma.booking.create({
    data: {
      listingId: input.listingId,
      guestId: userId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestCount: input.guestCount,
      specialNotes: input.specialNotes ?? null,
      status: BookingStatus.PENDING,
      totalPrice,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
    },
  });

  return {
    ...booking,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export async function cancel(bookingId: string, userId: string) {
  await assertBookingOwner(bookingId, userId);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Booking not found");
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "Booking is already cancelled");
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.CANCELLED,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
    },
  });

  return {
    ...updatedBooking,
    checkIn: updatedBooking.checkIn.toISOString(),
    checkOut: updatedBooking.checkOut.toISOString(),
    createdAt: updatedBooking.createdAt.toISOString(),
    updatedAt: updatedBooking.updatedAt.toISOString(),
  };
}



