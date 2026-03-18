import type { ApiSuccessResponse } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { apiClient, rawHttpClient } from "@/lib/api/client";
import { env } from "@/lib/api/env";

import {
  confirmationPayloadSchema,
  submissionDetailSchema,
  submissionSummarySchema,
  type ConfirmationPayload,
  type SubmissionDetail,
  type SubmissionSummary,
} from "./form-system-types";
import {
  getMockSubmissionDetail,
  listMockSubmissionSummaries,
} from "./form-system-mocks";

function shouldUseFallback(error: unknown): boolean {
  if (!env.ENABLE_FORM_FALLBACK) {
    return false;
  }

  if (error instanceof ApiError) {
    return error.status === undefined || error.status === 404 || error.status === 501;
  }

  return true;
}

async function resolveWithFallback<TData>(
  request: () => Promise<TData>,
  fallback: () => TData,
): Promise<TData> {
  try {
    return await request();
  } catch (error) {
    if (shouldUseFallback(error)) {
      return fallback();
    }

    throw error;
  }
}

export async function getConfirmationPayload(token: string): Promise<ConfirmationPayload> {
  const response = await rawHttpClient.get<ApiSuccessResponse<unknown>>(`/confirm/${token}`);
  return confirmationPayloadSchema.parse(response.data.data);
}

export async function submitConfirmation(
  token: string,
  answers: Record<string, string | boolean>,
): Promise<SubmissionDetail> {
  const response = await rawHttpClient.post<ApiSuccessResponse<unknown>>(`/confirm/${token}`, {
    answers,
  });
  return submissionDetailSchema.parse(response.data.data);
}

export interface SubmissionListParams {
  page?: number;
  pageSize?: number;
  statusGroup?: "active" | "completed";
  status?: string;
  search?: string;
  sort?: string;
  dir?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getSubmissionSummaries(
  params: SubmissionListParams = {},
): Promise<PaginatedResult<SubmissionSummary>> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  }
  const query = searchParams.toString();

  return resolveWithFallback(
    async () => {
      const response = await apiClient.get<ApiSuccessResponse<unknown>>(
        `/submissions${query ? `?${query}` : ""}`,
      );
      return {
        data: submissionSummarySchema.array().parse(response.data.data),
        meta: response.data.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    },
    () => {
      const all = listMockSubmissionSummaries();
      return { data: all, meta: { page: 1, limit: all.length, total: all.length, totalPages: 1 } };
    },
  );
}

export async function getSubmissionCounts(
  statusGroup?: "active" | "completed",
): Promise<Record<string, number>> {
  const query = statusGroup ? `?statusGroup=${statusGroup}` : "";
  const response = await apiClient.get<ApiSuccessResponse<unknown>>(`/submissions/counts${query}`);
  return response.data.data as Record<string, number>;
}

export interface Trip {
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalBookings: number;
  totalGuests: number;
  completedCount: number;
}

export async function getTrips(): Promise<Trip[]> {
  const response = await apiClient.get<ApiSuccessResponse<unknown>>("/submissions/trips");
  return response.data.data as Trip[];
}

export async function exportSubmissions(filters?: {
  propertyName?: string;
  checkIn?: string;
  checkOut?: string;
}): Promise<void> {
  const params = new URLSearchParams();
  if (filters?.propertyName) params.set("propertyName", filters.propertyName);
  if (filters?.checkIn) params.set("checkIn", filters.checkIn);
  if (filters?.checkOut) params.set("checkOut", filters.checkOut);

  const query = params.toString();
  const response = await apiClient.get(`/submissions/export${query ? `?${query}` : ""}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guest-list-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function getSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
  return resolveWithFallback(
    async () => {
      const response = await apiClient.get<ApiSuccessResponse<unknown>>(`/submissions/${submissionId}`);
      return submissionDetailSchema.parse(response.data.data);
    },
    () => {
      const submission = getMockSubmissionDetail(submissionId);

      if (!submission) {
        throw new ApiError("Submission not found", 404);
      }

      return submission;
    },
  );
}
