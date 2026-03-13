import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { ErrorAlert } from "@/components/feedback/error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DataTable,
  DataTableEmptyState,
  DataTablePagination,
  DataTableSkeleton,
  DataTableSortButton,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { SubmissionStatusBadge } from "@/features/form-system/components/submission-status-badge";
import { getSubmissionSummaries } from "@/features/form-system/form-system-api";
import type { SubmissionSummary } from "@/features/form-system/form-system-types";
import { formatDate } from "@/lib/utils/format";

type SubmissionSortKey = "updatedAt" | "guestName" | "completionPercent" | "bookingReference";
type SortDirection = "asc" | "desc";

function getNextDirection(
  sortKey: SubmissionSortKey,
  currentKey: SubmissionSortKey,
  currentDirection: SortDirection,
): SortDirection {
  if (sortKey !== currentKey) {
    return sortKey === "guestName" || sortKey === "bookingReference" ? "asc" : "desc";
  }

  return currentDirection === "asc" ? "desc" : "asc";
}

function compareSubmissions(
  left: SubmissionSummary,
  right: SubmissionSummary,
  sortKey: SubmissionSortKey,
  direction: SortDirection,
): number {
  const modifier = direction === "asc" ? 1 : -1;

  if (sortKey === "updatedAt") {
    return (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()) * modifier;
  }

  if (sortKey === "guestName") {
    return left.guestName.localeCompare(right.guestName) * modifier;
  }

  if (sortKey === "completionPercent") {
    return (left.completionPercent - right.completionPercent) * modifier;
  }

  if (sortKey === "bookingReference") {
    return left.bookingReference.localeCompare(right.bookingReference) * modifier;
  }

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

function parseSortKey(value: string | null): SubmissionSortKey {
  if (value === "guestName" || value === "completionPercent" || value === "bookingReference") {
    return value;
  }

  return "updatedAt";
}

function parseSortDirection(value: string | null): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

export default function DashboardPage(): React.JSX.Element {
  const submissionsQuery = useQuery({
    queryKey: ["submission-summaries"],
    queryFn: getSubmissionSummaries,
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const searchValue = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status");
  const statusFilter: SubmissionSummary["status"] | "all" =
    statusParam === "pending" ||
    statusParam === "in-progress" ||
    statusParam === "needs-review" ||
    statusParam === "completed"
      ? statusParam
      : "all";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePageSize(searchParams.get("pageSize"), 10);
  const sortKey = parseSortKey(searchParams.get("sort"));
  const sortDirection = parseSortDirection(searchParams.get("dir"));

  const submissions = submissionsQuery.data ?? [];
  const totalSubmissions = submissions.length;
  const completed = submissions.filter((item) => item.status === "completed").length;
  const inProgress = submissions.filter((item) => item.status === "in-progress").length;
  const needsReview = submissions.filter((item) => item.status === "needs-review").length;

  const filteredSubmissions = submissions
    .filter((submission) => {
      const query = searchValue.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        submission.guestName.toLowerCase().includes(query) ||
        submission.guestEmail.toLowerCase().includes(query) ||
        submission.bookingReference.toLowerCase().includes(query) ||
        submission.shopifyOrderNumber.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

      return matchesQuery && matchesStatus;
    })
    .sort((left, right) => compareSubmissions(left, right, sortKey, sortDirection));

  const pageCount = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedSubmissions = filteredSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasActiveFilters = searchValue.trim().length > 0 || statusFilter !== "all";

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
    updateParams({ q: null, status: null, page: null });
  }

  function updateSort(nextKey: SubmissionSortKey): void {
    const nextDirection = getNextDirection(nextKey, sortKey, sortDirection);
    updateParams({
      sort: nextKey === "updatedAt" ? null : nextKey,
      dir: nextDirection === "desc" && nextKey === "updatedAt" ? null : nextDirection,
      page: null,
    });
  }

  const columns: DataTableColumn<SubmissionSummary>[] = [
    {
      id: "booking",
      width: "140px",
      header: (
        <DataTableSortButton active={sortKey === "bookingReference"} direction={sortDirection} onClick={() => updateSort("bookingReference")}>
          Booking
        </DataTableSortButton>
      ),
      renderCell: (submission) => (
        <span className="font-semibold text-sm">{submission.bookingReference}</span>
      ),
    },
    {
      id: "confirmLink",
      width: "120px",
      header: "Confirm link",
      renderCell: (submission) =>
        submission.confirmationToken ? (
          <a
            className="confirm-link-btn"
            href={`/confirm/${submission.confirmationToken}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open guest confirmation form"
          >
            <svg className="confirm-link-btn__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M11 3h6v6M17 3L9 11M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Open link
          </a>
        ) : (
          <span className="confirm-done-badge">
            <svg className="confirm-done-badge__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Complete
          </span>
        ),
    },
    {
      id: "status",
      width: "140px",
      header: "Status",
      renderCell: (submission) => <SubmissionStatusBadge status={submission.status} />,
    },
    {
      id: "date",
      width: "160px",
      header: (
        <DataTableSortButton active={sortKey === "updatedAt"} direction={sortDirection} onClick={() => updateSort("updatedAt")}>
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
        <DataTableSortButton active={sortKey === "guestName"} direction={sortDirection} onClick={() => updateSort("guestName")}>
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
      id: "completion",
      width: "180px",
      header: (
        <DataTableSortButton active={sortKey === "completionPercent"} direction={sortDirection} onClick={() => updateSort("completionPercent")}>
          Completion
        </DataTableSortButton>
      ),
      renderCell: (submission) => (
        <div className="flex items-center gap-2 w-full max-w-[140px]">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${submission.completionPercent}%`,
                backgroundColor: "var(--primary)",
              }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground w-8 text-right">{submission.completionPercent}%</span>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Submissions</h1>
        <Button variant="secondary" onClick={() => submissionsQuery.refetch()}>
          Refresh
        </Button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-4 gap-4 stats-bar">
        <article className="stat-card">
          <div className="stat-card__label">Total submissions</div>
          <div className="stat-card__value">{totalSubmissions}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">In progress</div>
          <div className="stat-card__value">{inProgress}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Needs review</div>
          <div className="stat-card__value">{needsReview}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Completed</div>
          <div className="stat-card__value">{completed}</div>
        </article>
      </div>

      {submissionsQuery.error ? <ErrorAlert message={String(submissionsQuery.error.message)} /> : null}

      {/* ── Table section ── */}
      <section className="surface-card table-panel">
        {/* ── Filter bar ── */}
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
                placeholder="Search guest, booking..."
              />
            </div>

            <Select
              className="w-[180px]"
              value={statusFilter}
              onChange={(event) => updateParams({ status: event.target.value === "all" ? null : event.target.value, page: null })}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="needs-review">Needs review</option>
              <option value="completed">Completed</option>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {submissionsQuery.isLoading ? (
          <DataTableSkeleton columns={6} rows={8} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedSubmissions}
              getRowKey={(submission) => submission.id}
              emptyState={
                totalSubmissions === 0 ? (
                  <DataTableEmptyState title="No records yet" message="Records will appear here automatically." />
                ) : (
                  <DataTableEmptyState
                    title="No matching records"
                    message="Adjust your filters or search query."
                    action={
                      <Button variant="secondary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                )
              }
            />

            {filteredSubmissions.length > 0 ? (
              <DataTablePagination
                page={currentPage}
                pageCount={pageCount}
                pageSize={pageSize}
                totalItems={filteredSubmissions.length}
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

