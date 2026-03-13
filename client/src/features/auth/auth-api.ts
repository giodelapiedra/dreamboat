import type { ApiSuccessResponse } from "@/lib/api/types";
import { apiClient, rawHttpClient } from "@/lib/api/client";

import {
  authSessionResponseSchema,
  type AuthSessionResponse,
  type LoginFormValues,
  type RegisterFormValues,
} from "./auth-types";

export async function login(input: LoginFormValues): Promise<AuthSessionResponse> {
  const response = await rawHttpClient.post<ApiSuccessResponse<unknown>>("/auth/login", input);
  return authSessionResponseSchema.parse(response.data.data);
}

export async function register(input: RegisterFormValues): Promise<AuthSessionResponse> {
  const response = await rawHttpClient.post<ApiSuccessResponse<unknown>>("/auth/register", input);
  return authSessionResponseSchema.parse(response.data.data);
}

let pendingRefresh: Promise<AuthSessionResponse> | null = null;

export function refreshSession(): Promise<AuthSessionResponse> {
  if (!pendingRefresh) {
    pendingRefresh = rawHttpClient
      .post<ApiSuccessResponse<unknown>>("/auth/refresh")
      .then((response) => authSessionResponseSchema.parse(response.data.data))
      .finally(() => {
        pendingRefresh = null;
      });
  }

  return pendingRefresh;
}

export async function logout(): Promise<void> {
  await rawHttpClient.post("/auth/logout");
}

export async function me(): Promise<AuthSessionResponse["user"]> {
  const response = await apiClient.get<ApiSuccessResponse<unknown>>("/auth/me");
  return authSessionResponseSchema.shape.user.parse(response.data.data);
}
