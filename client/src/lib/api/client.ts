import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { authSessionResponseSchema } from "@/features/auth/auth-types";
import { authStore } from "@/features/auth/auth-store";

import { env } from "./env";
import { ApiError, type ApiErrorResponse, type ApiSuccessResponse } from "./types";

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const rawHttpClient = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

export const apiClient = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

function toApiError(error: AxiosError<ApiErrorResponse>): ApiError {
  const message =
    error.response?.data?.message ??
    error.response?.data?.error ??
    error.message ??
    "Request failed";

  return new ApiError(message, error.response?.status, error.response?.data?.issues);
}

async function refreshAccessToken(): Promise<string> {
  const response = await rawHttpClient.post<ApiSuccessResponse<unknown>>("/auth/refresh");
  const session = authSessionResponseSchema.parse(response.data.data);
  authStore.getState().setSession(session);
  return session.accessToken;
}

function shouldAttemptRefresh(error: AxiosError<ApiErrorResponse>): boolean {
  const config = error.config as RetriableConfig | undefined;

  if (!config || config._retry) {
    return false;
  }

  if (error.response?.status !== 401) {
    return false;
  }

  return !config.url?.includes("/auth/login") && !config.url?.includes("/auth/register") && !config.url?.includes("/auth/refresh");
}

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (!shouldAttemptRefresh(error)) {
      return Promise.reject(toApiError(error));
    }

    const originalRequest = error.config as RetriableConfig;
    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken();
      const accessToken = await refreshPromise;
      originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      authStore.getState().clearSession();
      return Promise.reject(
        refreshError instanceof AxiosError ? toApiError(refreshError) : refreshError,
      );
    } finally {
      refreshPromise = null;
    }
  },
);

rawHttpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => Promise.reject(toApiError(error)),
);
