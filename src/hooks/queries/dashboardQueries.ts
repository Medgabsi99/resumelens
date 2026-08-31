import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { JobApplication, ApplicationStatus } from "@/types";

export interface AnalysisSummaryItem {
  id: string;
  score: number;
  target_role: string | null;
  created_at: string;
}

export const QUERY_KEYS = {
  analyses: ["dashboard", "analyses"] as const,
  applications: ["dashboard", "applications"] as const,
  savedResumes: ["savedResumes"] as const,
};

/**
 * Hook to fetch all user resume analyses with TanStack Query caching.
 */
export function useAnalysesQuery() {
  return useQuery<AnalysisSummaryItem[]>({
    queryKey: QUERY_KEYS.analyses,
    queryFn: async () => {
      const res = await fetch("/api/history");
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch analysis history");
      }
      const data = await res.json();
      return data.analyses || [];
    },
  });
}

/**
 * Hook to fetch job applications for the Application Tracker.
 */
export function useApplicationsQuery() {
  return useQuery<JobApplication[]>({
    queryKey: QUERY_KEYS.applications,
    queryFn: async () => {
      const res = await fetch("/api/applications");
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch applications");
      }
      const data = await res.json();
      return data.applications || [];
    },
  });
}

/**
 * Hook to delete analyses with automatic cache invalidation.
 */
export function useDeleteAnalysesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete analysis");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analyses });
    },
  });
}

/**
 * Hook to update an application with optimistic update support.
 */
export function useUpdateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; status?: ApplicationStatus; notes?: string }) => {
      const res = await fetch(`/api/applications/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to update application");
      }
      return res.json();
    },
    onMutate: async (updatedApp) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.applications });
      const previousApps = queryClient.getQueryData<JobApplication[]>(QUERY_KEYS.applications);

      if (previousApps) {
        queryClient.setQueryData<JobApplication[]>(
          QUERY_KEYS.applications,
          previousApps.map((app) => (app.id === updatedApp.id ? { ...app, ...updatedApp } : app))
        );
      }

      return { previousApps };
    },
    onError: (_err, _newApp, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(QUERY_KEYS.applications, context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications });
    },
  });
}
