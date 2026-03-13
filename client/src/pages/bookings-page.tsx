import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { queryClient } from "@/app/query-client";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorAlert } from "@/components/feedback/error-alert";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { BookingSummaryCard } from "@/features/bookings/booking-summary-card";
import { getMyBookings } from "@/features/bookings/bookings-api";

export default function BookingsPage(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });

  return (
    <div className="container stack-lg">
      <section className="page-intro surface-card">
        <span className="eyebrow">My bookings</span>
        <h1>Track upcoming stays and booking status.</h1>
        <p>Bookings are live today. Payment and checkout confirmation flows are still pending in the backend.</p>
        {searchParams.get("status") === "created" ? (
          <div className="alert alert-success" role="status">
            <strong>Booking created</strong>
            <p>Your reservation request was saved. Payment integration can be connected once the backend checkout endpoint is implemented.</p>
          </div>
        ) : null}
      </section>

      {bookingsQuery.isLoading ? <LoadingPanel label="Loading your bookings" /> : null}
      {bookingsQuery.error ? <ErrorAlert message={String(bookingsQuery.error.message)} /> : null}

      {bookingsQuery.data && bookingsQuery.data.length > 0 ? (
        <section className="stack-md">
          {bookingsQuery.data.map((booking) => (
            <BookingSummaryCard
              key={booking.id}
              booking={booking}
              onCancelled={() => refreshMutation.mutate()}
            />
          ))}
        </section>
      ) : null}

      {bookingsQuery.data && bookingsQuery.data.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Start exploring stays and create your first booking request."
          action={
            <Link className="button button--primary" to="/">
              Browse listings
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
