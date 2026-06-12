import { useState, useCallback, useEffect } from "react";
import { ResumeVersion } from "./types";

export function useResumeVersions(
  analysisId: string | undefined,
  showHistory: boolean,
  currentText: string,
  currentScore: number
) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!analysisId) return;
    setIsLoadingVersions(true);
    setVersionError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/versions`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch versions");
      setVersions(data.data || []);
    } catch (err: any) {
      setVersionError(err.message || "Could not load version history");
    } finally {
      setIsLoadingVersions(false);
    }
  }, [analysisId]);

  useEffect(() => {
    if (analysisId && showHistory) {
      fetchVersions();
    }
  }, [analysisId, showHistory, fetchVersions]);

  const saveVersion = async (versionName: string) => {
    if (!analysisId || !versionName.trim()) return;
    setIsSavingVersion(true);
    setVersionError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionName: versionName.trim(),
          resumeText: currentText,
          score: currentScore,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save version");
      
      setVersions((prev) => [data.data, ...prev]);
      return data.data;
    } catch (err: any) {
      setVersionError(err.message || "Could not save version");
      throw err;
    } finally {
      setIsSavingVersion(false);
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (!analysisId) return;
    setVersionError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/versions?versionId=${versionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete version");
      
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
    } catch (err: any) {
      setVersionError(err.message || "Could not delete version");
      throw err;
    }
  };

  return {
    versions,
    setVersions,
    isLoadingVersions,
    isSavingVersion,
    versionError,
    setVersionError,
    fetchVersions,
    saveVersion,
    deleteVersion,
  };
}
