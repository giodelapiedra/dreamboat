import type { PaginationMeta } from "@dreamboat/shared";

export interface SuccessResponse<TData> {
  data: TData;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  error: string;
  message: string;
  issues?: unknown;
}

export function successResponse<TData>(
  data: TData,
  meta?: PaginationMeta,
): SuccessResponse<TData> {
  return meta ? { data, meta } : { data };
}

