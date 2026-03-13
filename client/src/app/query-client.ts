import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

import { getErrorMessage } from "@/lib/api/types";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("Query failed", getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("Mutation failed", getErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof error.status === "number" &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false;
        }

        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
