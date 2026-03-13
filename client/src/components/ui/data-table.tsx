import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

type DataTableAlign = "left" | "center" | "right";
type SortDirection = "asc" | "desc";

export interface DataTableColumn<TRow> {
  id: string;
  header: React.ReactNode;
  width?: string;
  align?: DataTableAlign;
  headerClassName?: string;
  cellClassName?: string;
  renderCell: (row: TRow) => React.ReactNode;
}

interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  getRowKey: (row: TRow) => string;
  rowClassName?: (row: TRow) => string | undefined;
  emptyState?: React.ReactNode;
  className?: string;
}

interface DataTableSortButtonProps {
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  children: React.ReactNode;
}

interface DataTablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

function alignClassName(align: DataTableAlign | undefined): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function SortIcon({ active, direction }: Pick<DataTableSortButtonProps, "active" | "direction">): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ opacity: active ? 1 : 0.3 }}
    >
      <path
        d="M6 2.5L2.5 6H9.5L6 2.5Z"
        fill="currentColor"
        opacity={active && direction === "desc" ? 0.3 : 1}
      />
      <path
        d="M6 9.5L9.5 6H2.5L6 9.5Z"
        fill="currentColor"
        opacity={active && direction === "asc" ? 0.3 : 1}
      />
    </svg>
  );
}

function getPaginationItems(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, 5, "ellipsis", pageCount];
  }

  if (page >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", pageCount];
}

export function DataTableSortButton({
  active,
  direction,
  onClick,
  children,
}: DataTableSortButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn("data-table__sort", active && "is-active")}
      onClick={onClick}
    >
      <span>{children}</span>
      <SortIcon active={active} direction={direction} />
    </button>
  );
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  rowClassName,
  emptyState,
  className,
}: DataTableProps<TRow>): React.JSX.Element {
  return (
    <div className={cn("data-table-container", className)}>
      {rows.length === 0 ? (
        emptyState ?? <DataTableEmptyState title="No rows found" message="Try adjusting your search or filters." />
      ) : (
        <table className="data-table">
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={column.width ? { width: column.width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} className={cn(alignClassName(column.align), column.headerClassName)} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className={rowClassName?.(row)}>
                {columns.map((column) => (
                  <td key={column.id} className={cn(alignClassName(column.align), column.cellClassName)}>
                    {column.renderCell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function DataTablePagination({
  page,
  pageCount,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "results",
}: DataTablePaginationProps): React.JSX.Element {
  const safePageCount = Math.max(pageCount, 1);
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(totalItems, page * pageSize);
  const pageItems = getPaginationItems(page, safePageCount);

  return (
    <div className="table-pagination">
      <div className="table-pagination__summary">
        Showing <strong>{startItem}-{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}
      </div>

      <div className="table-pagination__controls">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 w-[70px]"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="table-pagination__numbers" aria-label="Pagination">
          <Button 
            variant="ghost" 
            className="button--compact"
            onClick={() => onPageChange(page - 1)} 
            disabled={page <= 1}
          >
            Prev
          </Button>

          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <button
                key={item}
                type="button"
                className={cn("table-pagination__number", item === page && "is-active")}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </button>
            ),
          )}

          <Button 
            variant="ghost" 
            className="button--compact"
            onClick={() => onPageChange(page + 1)} 
            disabled={page >= safePageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTableSkeleton({
  columns = 6,
  rows = 6,
  className,
}: DataTableSkeletonProps): React.JSX.Element {
  return (
    <div className={cn("p-4 space-y-4", className)} aria-hidden="true">
      <div className="flex gap-4 mb-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex gap-4 py-3 border-b border-slate-100"
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <div key={`cell-${rowIndex}-${columnIndex}`} className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataTableEmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
      {action}
    </div>
  );
}
