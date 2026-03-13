import { useMutation } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cancelBooking } from "@/features/bookings/bookings-api";
import type { BookingRecord } from "@/features/bookings/bookings-types";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";

interface BookingSummaryCardProps {
  booking: BookingRecord;
  onCancelled: () => void;
}

function getTone(status: BookingRecord["status"]): "neutral" | "success" | "warning" {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELLED") {
    return "warning";
  }

  return "neutral";
}

export function BookingSummaryCard({ booking, onCancelled }: BookingSummaryCardProps): React.JSX.Element {
  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onSuccess: onCancelled,
  });

  return (
    <Card className="booking-card">
      {booking.listing.images?.[0]?.url ? (
        <img className="booking-card__image" src={booking.listing.images[0].url} alt={booking.listing.title} />
      ) : (
        <div className="booking-card__image booking-card__image--placeholder" />
      )}
      <div className="booking-card__content">
        <div className="booking-card__header">
          <div>
            <h3>{booking.listing.title}</h3>
            <p>{booking.listing.location}</p>
          </div>
          <Badge tone={getTone(booking.status)}>{booking.status.toLowerCase()}</Badge>
        </div>
        <p>{formatDateRange(booking.checkIn, booking.checkOut)}</p>
        <p>{booking.guestCount} guests</p>
        <strong>{formatCurrency(booking.totalPrice)}</strong>
        <div className="booking-card__actions">
          <Button
            variant="ghost"
            disabled={booking.status === "CANCELLED" || cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? "Cancelling..." : "Cancel booking"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
