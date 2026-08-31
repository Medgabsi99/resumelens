import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a QueryClient with production defaults:
 * - 5 minutes stale time
 * - 30 minutes garbage collection retention
 * - Window focus refetch disabled to save API credits
 * - Single transient retry
 */
export function createDefaultQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
