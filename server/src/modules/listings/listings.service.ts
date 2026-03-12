import { BookingStatus, Prisma } from "../../../generated/prisma";
import { StatusCodes } from "http-status-codes";

import type { Role } from "@dreamboat/shared";
import { HttpError } from "../../lib/http-error";
import { prisma } from "../../lib/prisma";

interface ListingActor {
  id: string;
  role: Role;
}

export interface ListingQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  location?: string;
  sort:
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

function canAccessUnpublishedListings(actor?: ListingActor): boolean {
  return actor?.role === "HOST" || actor?.role === "ADMIN";
}

function buildWhereClause(
  query: ListingQuery,
  actor?: ListingActor,
): Prisma.ListingWhereInput {
  const andFilters: Prisma.ListingWhereInput[] = [];

  if (actor?.role === "HOST") {
    andFilters.push({ hostId: actor.id });
  }

  if (!canAccessUnpublishedListings(actor)) {
    andFilters.push({ isPublished: true });
  }

  if (typeof query.isPublished === "boolean") {
    andFilters.push({ isPublished: query.isPublished });
  }

  if (query.search) {
    andFilters.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { location: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  if (query.category) {
    andFilters.push({ category: query.category });
  }

  if (query.location) {
    andFilters.push({
      location: { contains: query.location, mode: "insensitive" },
    });
  }

  if (typeof query.minPrice === "number" || typeof query.maxPrice === "number") {
    const priceFilter: Prisma.DecimalFilter<"Listing"> = {};

    if (typeof query.minPrice === "number") {
      priceFilter.gte = query.minPrice;
    }

    if (typeof query.maxPrice === "number") {
      priceFilter.lte = query.maxPrice;
    }

    andFilters.push({
      pricePerNight: priceFilter,
    });
  }

  if (query.guestCount) {
    andFilters.push({
      maxGuests: { gte: query.guestCount },
    });
  }

  if (query.amenities?.length) {
    andFilters.push({
      amenities: {
        hasEvery: query.amenities,
      },
    });
  }

  if (query.checkIn && query.checkOut) {
    andFilters.push({
      bookings: {
        none: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
          checkIn: { lt: new Date(query.checkOut) },
          checkOut: { gt: new Date(query.checkIn) },
        },
      },
    });
  }

  return andFilters.length ? { AND: andFilters } : {};
}

function buildOrderBy(
  sort: ListingQuery["sort"],
): Prisma.ListingOrderByWithRelationInput {
  if (sort === "updated_desc" || sort === "newest") {
    return { updatedAt: "desc" };
  }

  if (sort === "updated_asc") {
    return { updatedAt: "asc" };
  }

  if (sort === "title_asc") {
    return { title: "asc" };
  }

  if (sort === "title_desc") {
    return { title: "desc" };
  }

  if (sort === "price_asc") {
    return { pricePerNight: "asc" };
  }

  if (sort === "price_desc") {
    return { pricePerNight: "desc" };
  }

  if (sort === "review_asc") {
    return { reviews: { _count: "asc" } };
  }

  if (sort === "review_desc") {
    return { reviews: { _count: "desc" } };
  }

  return { updatedAt: "desc" };
}

async function assertListingOwner(
  listingId: string,
  actor: ListingActor,
): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      hostId: true,
    },
  });

  if (!listing) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  if (listing.hostId !== actor.id && actor.role !== "ADMIN") {
    throw new HttpError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to modify this listing",
    );
  }
}

export async function getAll(query: ListingQuery, actor?: ListingActor) {
  const skip = (query.page - 1) * query.limit;
  const where = buildWhereClause(query, actor);

  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.limit,
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    data: listings.map((listing: (typeof listings)[number]) => ({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      averageRating:
        listing.reviews.length > 0
          ? listing.reviews.reduce(
              (sum: number, review: { rating: number }) => sum + review.rating,
              0,
            ) / listing.reviews.length
          : null,
      reviewCount: listing.reviews.length,
    })),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getById(id: string, actor?: ListingActor) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      host: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      reviews: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!listing) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  if (!listing.isPublished && !canAccessUnpublishedListings(actor)) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  if (actor?.role === "HOST" && listing.hostId !== actor.id) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  return {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    averageRating:
      listing.reviews.length > 0
        ? listing.reviews.reduce(
            (sum: number, review: { rating: number }) => sum + review.rating,
            0,
          ) / listing.reviews.length
        : null,
  };
}

export async function create(
  actor: ListingActor,
  input: {
    title: string;
    description: string;
    category: string;
    pricePerNight: number;
    currency: string;
    location: string;
    address: string;
    latitude?: number;
    longitude?: number;
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    isPublished?: boolean;
    images?: Array<{ url: string; alt?: string; order?: number }>;
  },
) {
  const imagesData = input.images?.length
    ? {
        create: input.images.map((image, index) => ({
          url: image.url,
          alt: image.alt ?? null,
          order: image.order ?? index,
        })),
      }
    : undefined;

  const data: Prisma.ListingCreateInput = {
    title: input.title,
    description: input.description,
    category: input.category,
    pricePerNight: new Prisma.Decimal(input.pricePerNight),
    currency: input.currency.toUpperCase(),
    location: input.location,
    address: input.address,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    maxGuests: input.maxGuests,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    amenities: input.amenities,
    isPublished: input.isPublished ?? false,
    host: {
      connect: {
        id: actor.id,
      },
    },
  };

  if (imagesData) {
    data.images = imagesData;
  }

  const listing = await prisma.listing.create({
    data,
    include: {
      images: {
        orderBy: { order: "asc" },
      },
    },
  });

  return {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

export async function update(
  listingId: string,
  actor: ListingActor,
  input: {
    title?: string;
    description?: string;
    category?: string;
    pricePerNight?: number;
    currency?: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    maxGuests?: number;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    isPublished?: boolean;
  },
) {
  await assertListingOwner(listingId, actor);

  const data: Prisma.ListingUpdateInput = { ...input };

  if (typeof input.pricePerNight === "number") {
    data.pricePerNight = new Prisma.Decimal(input.pricePerNight);
  }

  if (input.currency) {
    data.currency = input.currency.toUpperCase();
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data,
  });

  return {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

export async function remove(listingId: string, actor: ListingActor): Promise<void> {
  await assertListingOwner(listingId, actor);

  await prisma.listing.delete({
    where: { id: listingId },
  });
}

export async function getAvailability(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!listing) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: id,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
    },
    orderBy: {
      checkIn: "asc",
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
  });

  return bookings.map((booking: (typeof bookings)[number]) => ({
    ...booking,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
  }));
}
