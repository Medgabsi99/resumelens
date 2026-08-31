"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./dashboardQueries";

export interface SavedResumeVersion {
  id: string;
  version_name: string;
  resume_text: string;
  score: number | null;
  target_role?: string | null;
  job_description?: string | null;
  created_at: string;
}

/**
 * Hook to fetch user's saved resume versions with TanStack Query caching.
 */
export function useSavedResumesQuery() {
  return useQuery<SavedResumeVersion[]>({
    queryKey: QUERY_KEYS.savedResumes,
    queryFn: async () => {
      const res = await fetch("/api/resumes");
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch saved resumes");
      }
      const data = await res.json();
      return data.resumes || [];
    },
  });
}

/**
 * Hook to save a new resume version with automatic cache invalidation.
 */
export function useSaveResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      version_name: string;
      resume_text: string;
      score?: number;
      target_role?: string;
      job_description?: string;
    }) => {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save resume");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savedResumes });
    },
  });
}
