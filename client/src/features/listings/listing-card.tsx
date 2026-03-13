import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

import type { ListingSummary } from "./listings-types";

interface ListingCardProps {
  listing: ListingSummary;
}

export function ListingCard({ listing }: ListingCardProps): React.JSX.Element {
  const coverImage = listing.images[0]?.url;

  return (
    <Card className="listing-card">
      <div className="listing-card__media">
        {coverImage ? <img src={coverImage} alt={listing.title} loading="lazy" /> : <div className="listing-card__placeholder" />}
        <Badge tone={listing.isPublished ? "success" : "warning"}>
          {listing.isPublished ? listing.category : "Draft"}
        </Badge>
      </div>
      <div className="listing-card__body">
        <div className="listing-card__header">
          <div>
            <h3>{listing.title}</h3>
            <p>{listing.location}</p>
          </div>
          <strong>{formatCurrency(listing.pricePerNight, listing.currency)}</strong>
        </div>
        <p className="listing-card__description">{listing.description}</p>
        <div className="listing-card__meta">
          <span>{listing.maxGuests} guests</span>
          <span>{listing.bedrooms} bedrooms</span>
          <span>{listing.bathrooms} baths</span>
        </div>
        <div className="listing-card__footer">
          <span>
            {listing.averageRating ? `${listing.averageRating.toFixed(1)} / 5` : "New listing"}
            {listing.reviewCount > 0 ? ` (${listing.reviewCount} reviews)` : ""}
          </span>
          <Link className="button button--ghost" to={`/listings/${listing.id}`}>
            View stay
          </Link>
        </div>
      </div>
    </Card>
  );
}
