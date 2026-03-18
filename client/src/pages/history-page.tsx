import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

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
import { getSubmissionSummaries } from "@/features/form-system/form-system-api";
import type { SubmissionSummary } from "@/features/form-system/form-system-types";
import { formatDate } from "@/lib/utils/format";

type SortKey = "updatedAt" | "guestName" | "bookingReference";
type SortDirection = "asc" | "desc";

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function parsePageSize(value: string | null): number {
  const n = Number(value);
  return [10, 20, 50].includes(n) ? n : 10;
}

function parseSortKey(value: string | null): SortKey {
  if (value === "guestName" || value === "bookingReference") return value;
  return "updatedAt";
}

function parseSortDir(value: string | null): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

export default function HistoryPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const page = parsePage(searchParams.get("page"));
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const sort = parseSortKey(searchParams.get("sort"));
  const dir = parseSortDir(searchParams.get("dir"));

  const queryParams = {
    page,
    pageSize,
    statusGroup: "completed" as const,
    search: search || undefined,
    sort,
    dir,
  };

  const submissionsQuery = useQuery({
    queryKey: ["submission-summaries", queryParams],
    queryFn: () => getSubmissionSummaries(queryParams),
  });

  const result = submissionsQuery.data;

  function updateParams(updates: Record<string, string | null>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  function updateSort(nextKey: SortKey): void {
    const nextDir = sort === nextKey ? (dir === "asc" ? "desc" : "asc") : nextKey === "guestName" || nextKey === "bookingReference" ? "asc" : "desc";
    updateParams({
      sort: nextKey === "updatedAt" ? null : nextKey,
      dir: nextDir === "desc" && nextKey === "updatedAt" ? null : nextDir,
      page: null,
    });
  }

  const hasSearch = search.trim().length > 0;

  const columns: DataTableColumn<SubmissionSummary>[] = [
    {
      id: "booking",
      width: "140px",
      header: (
        <DataTableSortButton active={sort === "bookingReference"} direction={dir} onClick={() => updateSort("bookingReference")}>
          Booking #
        </DataTableSortButton>
      ),
      renderCell: (submission) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{submission.shopifyOrderNumber}</span>
          <span className="text-xs text-muted-foreground">{submission.bookingReference}</span>
        </div>
      ),
    },
    {
      id: "date",
      width: "160px",
      header: (
        <DataTableSortButton active={sort === "updatedAt"} direction={dir} onClick={() => updateSort("updatedAt")}>
          Date
        </DataTableSortButton>
      ),
      renderCell: (submission) => (
        <span className="text-sm text-muted-foreground">{formatDate(submission.updatedAt)}</span>
      ),
    },
    {
      id: "guest",
      header: (
        <DataTableSortButton active={sort === "guestName"} direction={dir} onClick={() => updateSort("guestName")}>
          Guest
        </DataTableSortButton>
      ),
      renderCell: (submission) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {submission.guestName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">{submission.guestName}</span>
            <span className="text-xs text-muted-foreground">{submission.guestEmail}</span>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      width: "100px",
      align: "right",
      header: "",
      renderCell: (submission) => (
        <Link
          className="button button--ghost button--compact text-muted-foreground"
          to={`/dashboard/submissions/${submission.id}`}
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">History</h1>
          <p className="text-sm text-muted-foreground mt-1">{result ? `${result.meta.total} completed` : "Loading..."}</p>
        </div>
        <Button variant="secondary" onClick={() => submissionsQuery.refetch()}>
          Refresh
        </Button>
      </div>

      {submissionsQuery.error ? <ErrorAlert message={String(submissionsQuery.error.message)} /> : null}

      <section className="surface-card table-panel">
        {/* Search bar */}
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
                value={search}
                onChange={(event) => updateParams({ q: event.target.value || null, page: null })}
                placeholder="Search guest, booking..."
              />
            </div>

            {hasSearch && (
              <Button variant="ghost" onClick={() => updateParams({ q: null, page: null })}>
                Clear search
              </Button>
            )}
          </div>
        </div>

        {submissionsQuery.isLoading ? (
          <DataTableSkeleton columns={4} rows={8} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={result?.data ?? []}
              getRowKey={(submission) => submission.id}
              emptyState={
                !hasSearch ? (
                  <DataTableEmptyState title="No completed bookings yet" message="Completed confirmations will appear here." />
                ) : (
                  <DataTableEmptyState
                    title="No matching records"
                    message="Adjust your search query."
                    action={
                      <Button variant="secondary" onClick={() => updateParams({ q: null, page: null })}>
                        Clear search
                      </Button>
                    }
                  />
                )
              }
            />

            {result && result.meta.total > 0 ? (
              <DataTablePagination
                page={result.meta.page}
                pageCount={result.meta.totalPages}
                pageSize={result.meta.limit}
                totalItems={result.meta.total}
                itemLabel="records"
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
