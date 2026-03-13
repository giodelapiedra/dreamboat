import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { ErrorAlert } from "@/components/feedback/error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  DataTableEmptyState,
  DataTablePagination,
  DataTableSkeleton,
  DataTableSortButton,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { getTrips, exportSubmissions, type Trip } from "@/features/form-system/form-system-api";

type TripSortKey = "propertyName" | "checkIn" | "totalGuests" | "totalBookings" | "completedCount";
type SortDirection = "asc" | "desc";

function formatDateRange(checkIn: string, checkOut: string): string {
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthIn = months[dIn.getMonth()] ?? "";
  const dayIn = dIn.getDate();
  const dayOut = dOut.getDate();

  if (dIn.getMonth() === dOut.getMonth() && dIn.getFullYear() === dOut.getFullYear()) {
    return `${monthIn} ${dayIn}–${dayOut}, ${dIn.getFullYear()}`;
  }

  const monthOut = months[dOut.getMonth()] ?? "";
  return `${monthIn} ${dayIn} – ${monthOut} ${dayOut}, ${dOut.getFullYear()}`;
}

function nightCount(checkIn: string, checkOut: string): number {
  const msPerDay = 86_400_000;
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay));
}

function compareTrips(left: Trip, right: Trip, key: TripSortKey, dir: SortDirection): number {
  const m = dir === "asc" ? 1 : -1;

  if (key === "propertyName") return left.propertyName.localeCompare(right.propertyName) * m;
  if (key === "checkIn") return (new Date(left.checkIn).getTime() - new Date(right.checkIn).getTime()) * m;
  if (key === "totalGuests") return (left.totalGuests - right.totalGuests) * m;
  if (key === "totalBookings") return (left.totalBookings - right.totalBookings) * m;
  if (key === "completedCount") return (left.completedCount - right.completedCount) * m;
  return 0;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | null, fallback: number): number {
  const parsed = parsePositiveInt(value, fallback);
  return [10, 20, 50].includes(parsed) ? parsed : fallback;
}

function parseSortKey(value: string | null): TripSortKey {
  if (
    value === "propertyName" ||
    value === "totalGuests" ||
    value === "totalBookings" ||
    value === "completedCount"
  ) {
    return value;
  }
  return "checkIn";
}

function parseSortDirection(value: string | null): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function getNextDirection(nextKey: TripSortKey, currentKey: TripSortKey, currentDir: SortDirection): SortDirection {
  if (nextKey !== currentKey) {
    return nextKey === "propertyName" ? "asc" : "desc";
  }
  return currentDir === "asc" ? "desc" : "asc";
}

export default function TripsPage(): React.JSX.Element {
  const tripsQuery = useQuery({
    queryKey: ["trips"],
    queryFn: getTrips,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const searchValue = searchParams.get("q") ?? "";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePageSize(searchParams.get("pageSize"), 10);
  const sortKey = parseSortKey(searchParams.get("sort"));
  const sortDirection = parseSortDirection(searchParams.get("dir"));

  const trips = tripsQuery.data ?? [];

  // Stats
  const totalTrips = trips.length;
  const totalGuests = trips.reduce((sum, t) => sum + t.totalGuests, 0);
  const totalCompleted = trips.reduce((sum, t) => sum + t.completedCount, 0);
  const totalBookings = trips.reduce((sum, t) => sum + t.totalBookings, 0);

  // Filter + sort
  const filteredTrips = trips
    .filter((trip) => {
      const query = searchValue.trim().toLowerCase();
      if (query.length === 0) return true;
      return (
        trip.propertyName.toLowerCase().includes(query) ||
        trip.checkIn.includes(query) ||
        trip.checkOut.includes(query)
      );
    })
    .sort((a, b) => compareTrips(a, b, sortKey, sortDirection));

  const pageCount = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasActiveFilters = searchValue.trim().length > 0;

  function updateParams(updates: Record<string, string | null>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters(): void {
    updateParams({ q: null, page: null });
  }

  function updateSort(nextKey: TripSortKey): void {
    const nextDir = getNextDirection(nextKey, sortKey, sortDirection);
    updateParams({
      sort: nextKey === "checkIn" ? null : nextKey,
      dir: nextDir === "desc" && nextKey === "checkIn" ? null : nextDir,
      page: null,
    });
  }

  async function handleExport(trip: Trip): Promise<void> {
    const key = `${trip.propertyName}|${trip.checkIn}|${trip.checkOut}`;
    setExportingKey(key);
    try {
      await exportSubmissions({
        propertyName: trip.propertyName,
        checkIn: trip.checkIn,
        checkOut: trip.checkOut,
      });
    } catch {
      // user can retry
    } finally {
      setExportingKey(null);
    }
  }

  const columns: DataTableColumn<Trip>[] = [
    {
      id: "trip",
      header: (
        <DataTableSortButton active={sortKey === "propertyName"} direction={sortDirection} onClick={() => updateSort("propertyName")}>
          Trip
        </DataTableSortButton>
      ),
      renderCell: (trip) => (
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-semibold text-slate-900">{trip.propertyName}</span>
          <span className="text-xs text-muted-foreground">{formatDateRange(trip.checkIn, trip.checkOut)}</span>
        </div>
      ),
    },
    {
      id: "schedule",
      width: "140px",
      header: (
        <DataTableSortButton active={sortKey === "checkIn"} direction={sortDirection} onClick={() => updateSort("checkIn")}>
          Dates
        </DataTableSortButton>
      ),
      renderCell: (trip) => (
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-muted-foreground">{nightCount(trip.checkIn, trip.checkOut)} nights</span>
        </div>
      ),
    },
    {
      id: "guests",
      width: "100px",
      header: (
        <DataTableSortButton active={sortKey === "totalGuests"} direction={sortDirection} onClick={() => updateSort("totalGuests")}>
          Guests
        </DataTableSortButton>
      ),
      renderCell: (trip) => (
        <span className="text-sm font-semibold">{trip.totalGuests}</span>
      ),
    },
    {
      id: "bookings",
      width: "110px",
      header: (
        <DataTableSortButton active={sortKey === "totalBookings"} direction={sortDirection} onClick={() => updateSort("totalBookings")}>
          Bookings
        </DataTableSortButton>
      ),
      renderCell: (trip) => (
        <span className="text-sm text-muted-foreground">{trip.totalBookings}</span>
      ),
    },
    {
      id: "confirmed",
      width: "140px",
      header: (
        <DataTableSortButton active={sortKey === "completedCount"} direction={sortDirection} onClick={() => updateSort("completedCount")}>
          Confirmed
        </DataTableSortButton>
      ),
      renderCell: (trip) => {
        const allDone = trip.completedCount === trip.totalBookings && trip.totalBookings > 0;
        return (
          <span className={`status-badge ${allDone ? "status-badge--success" : "status-badge--warning"}`}>
            {trip.completedCount}/{trip.totalBookings}
          </span>
        );
      },
    },
    {
      id: "actions",
      width: "120px",
      align: "right",
      header: "",
      renderCell: (trip) => {
        const key = `${trip.propertyName}|${trip.checkIn}|${trip.checkOut}`;
        const isExporting = exportingKey === key;
        return (
          <Button
            variant="secondary"
            className="button--compact"
            onClick={() => handleExport(trip)}
            disabled={isExporting}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isExporting ? "..." : "Export"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Trips</h1>
        <Button variant="secondary" onClick={() => tripsQuery.refetch()}>
          Refresh
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 stats-bar">
        <article className="stat-card">
          <div className="stat-card__label">Total trips</div>
          <div className="stat-card__value">{totalTrips}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total guests</div>
          <div className="stat-card__value">{totalGuests}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total bookings</div>
          <div className="stat-card__value">{totalBookings}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Confirmed</div>
          <div className="stat-card__value">{totalCompleted}/{totalBookings}</div>
        </article>
      </div>

      {tripsQuery.error ? <ErrorAlert message={String(tripsQuery.error.message)} /> : null}

      {/* ── Table ── */}
      <section className="surface-card table-panel">
        {/* ── Toolbar ── */}
        <div className="table-toolbar">
          <div className="flex items-center gap-3 flex-1">
            <div className="table-search">
              <span className="table-search__icon">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8.5" cy="8.5" r="5.25" />
                  <path d="M12.5 12.5L16.25 16.25" strokeLinecap="round" />
                </svg>
              </span>
              <Input
                className="table-search__input"
                value={searchValue}
                onChange={(event) => updateParams({ q: event.target.value || null, page: null })}
                placeholder="Search property, dates..."
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {tripsQuery.isLoading ? (
          <DataTableSkeleton columns={6} rows={5} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedTrips}
              getRowKey={(trip) => `${trip.propertyName}|${trip.checkIn}|${trip.checkOut}`}
              emptyState={
                totalTrips === 0 ? (
                  <DataTableEmptyState
                    title="No trips yet"
                    message="Trips will appear here when guests book through Shopify."
                  />
                ) : (
                  <DataTableEmptyState
                    title="No matching trips"
                    message="Adjust your search query."
                    action={
                      <Button variant="secondary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                )
              }
            />

            {filteredTrips.length > 0 ? (
              <DataTablePagination
                page={currentPage}
                pageCount={pageCount}
                pageSize={pageSize}
                totalItems={filteredTrips.length}
                itemLabel="trips"
                onPageChange={(nextPage) => updateParams({ page: nextPage <= 1 ? null : String(nextPage) })}
                onPageSizeChange={(value) => updateParams({ pageSize: value === 10 ? null : String(value), page: null })}
                pageSizeOptions={[10, 20, 50]}
              />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
