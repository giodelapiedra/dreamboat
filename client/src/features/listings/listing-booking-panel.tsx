import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ErrorAlert } from "@/components/feedback/error-alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/features/auth/auth-store";
import { createBooking } from "@/features/bookings/bookings-api";
import {
  bookingFormSchema,
  type BookingFormInput,
  type BookingFormValues,
} from "@/features/bookings/bookings-types";
import { type AvailabilityEntry, type ListingDetail } from "@/features/listings/listings-types";
import { getErrorMessage } from "@/lib/api/types";
import { getNights, getTodayInputValue, toStableIsoDate } from "@/lib/utils/date";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";

interface ListingBookingPanelProps {
  availability: AvailabilityEntry[];
  listing: ListingDetail;
}

function hasConflict(
  values: Pick<BookingFormValues, "checkIn" | "checkOut">,
  availability: AvailabilityEntry[],
): boolean {
  if (!values.checkIn || !values.checkOut) {
    return false;
  }

  const requestedCheckIn = new Date(toStableIsoDate(values.checkIn));
  const requestedCheckOut = new Date(toStableIsoDate(values.checkOut));

  return availability.some((entry) => {
    if (entry.status === "CANCELLED" || entry.status === "COMPLETED") {
      return false;
    }

    return new Date(entry.checkIn) < requestedCheckOut && new Date(entry.checkOut) > requestedCheckIn;
  });
}

export function ListingBookingPanel({ availability, listing }: ListingBookingPanelProps): React.JSX.Element {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestCount: 1,
      specialNotes: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      navigate("/account/bookings?status=created");
    },
  });

  const values = watch();
  const nights = values.checkIn && values.checkOut ? getNights(values.checkIn, values.checkOut) : 0;
  const estimatedTotal = nights > 0 ? Number(listing.pricePerNight) * nights : 0;
  const blockedDates = availability.slice(0, 4);
  const conflict = hasConflict(values, availability);

  async function submit(formValues: BookingFormValues): Promise<void> {
    if (formValues.guestCount > listing.maxGuests) {
      setError("guestCount", {
        message: `This stay allows up to ${listing.maxGuests} guests`,
      });
      return;
    }

    if (hasConflict(formValues, availability)) {
      setError("checkOut", {
        message: "Those dates overlap with an existing booking",
      });
      return;
    }

    const payload: {
      listingId: string;
      checkIn: string;
      checkOut: string;
      guestCount: number;
      specialNotes?: string;
    } = {
      listingId: listing.id,
      checkIn: toStableIsoDate(formValues.checkIn),
      checkOut: toStableIsoDate(formValues.checkOut),
      guestCount: formValues.guestCount,
    };

    if (formValues.specialNotes?.trim()) {
      payload.specialNotes = formValues.specialNotes.trim();
    }

    await bookingMutation.mutateAsync(payload);
  }

  return (
    <Card className="booking-panel">
      <div className="booking-panel__header">
        <span className="eyebrow">Reserve this stay</span>
        <strong>{formatCurrency(listing.pricePerNight, listing.currency)} / night</strong>
      </div>

      {!user ? (
        <div className="booking-panel__login-cta">
          <p>Sign in to create bookings and manage your upcoming stays.</p>
          <Link className="button button--primary" to="/login">
            Sign in to continue
          </Link>
        </div>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit(submit)}>
          <Field label="Check in" error={errors.checkIn?.message}>
            <Input type="date" min={getTodayInputValue()} {...register("checkIn")} />
          </Field>
          <Field label="Check out" error={errors.checkOut?.message}>
            <Input type="date" min={getTodayInputValue()} {...register("checkOut")} />
          </Field>
          <Field label="Guests" error={errors.guestCount?.message}>
            <Input type="number" min="1" max={String(listing.maxGuests)} {...register("guestCount")} />
          </Field>
          <Field label="Special notes" error={errors.specialNotes?.message}>
            <Textarea rows={4} {...register("specialNotes")} />
          </Field>

          {conflict ? (
            <ErrorAlert
              title="Date conflict"
              message="The selected dates already overlap with a pending or confirmed booking."
            />
          ) : null}

          {bookingMutation.error ? (
            <ErrorAlert message={getErrorMessage(bookingMutation.error)} />
          ) : null}

          <div className="booking-panel__summary">
            <span>{nights > 0 ? `${nights} nights selected` : "Pick your travel dates"}</span>
            <strong>{nights > 0 ? formatCurrency(estimatedTotal, listing.currency) : "Estimated total"}</strong>
          </div>

          <Button type="submit" fullWidth disabled={bookingMutation.isPending}>
            {bookingMutation.isPending ? "Submitting..." : "Create booking"}
          </Button>
        </form>
      )}

      <div className="info-callout">
        <strong>Payments are not live yet.</strong>
        <p>
          The backend currently creates bookings, but Stripe checkout still returns a 501 response. Guests can complete booking requests now and payment can be layered in later.
        </p>
      </div>

      <div className="availability-list">
        <h3>Upcoming blocked dates</h3>
        {blockedDates.length > 0 ? (
          <ul>
            {blockedDates.map((entry) => (
              <li key={entry.id}>{formatDateRange(entry.checkIn, entry.checkOut)}</li>
            ))}
          </ul>
        ) : (
          <p>No pending or confirmed date blocks yet.</p>
        )}
      </div>
    </Card>
  );
}
