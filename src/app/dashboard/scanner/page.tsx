"use client";
import { logger } from "@/lib/logger";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import DashboardLayout from "@/components/DashboardLayout";
import { type AtsStructureResult } from "@/lib/ai";
import dynamic from "next/dynamic";

const AtsScannerBoard = dynamic(() => import("@/components/AtsScannerBoard"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted">Loading ATS Scanner...</div>,
});

const SCANNING_STEPS = [
  "Reading document structure...",
  "Scanning column layout blocks...",
  "Evaluating heading definitions...",
  "Verifying text extraction layer...",
  "Detecting charts & graphical rating sets...",
  "Finalizing scorecard metrics...",
];

export default function ScannerPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // File states
  const [fileName, setFileName] = useState<string | null>(null);

  // Scanner results
  const [scannerData, setScannerData] = useState<AtsStructureResult | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if query param analysisId is present
    const params = new URLSearchParams(window.location.search);
    const analysisId = params.get("analysisId");

    if (analysisId) {
      loadPastAnalysis(analysisId);
    }
  }, []);

  const loadPastAnalysis = async (id: string) => {
    setLoading(true);
    setError(null);
    setScannerData(null);
    setScanStep(0);

    // Loading interval
    const interval = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, SCANNING_STEPS.length - 1));
    }, 1800);

    try {
      // 1. Fetch past analysis text
      const res = await fetch(`/api/analyses/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load past analysis");
      }

      const resumeText = data.data.resume_text || data.data.resumeText;
      if (!resumeText) {
        throw new Error("No resume text available in this past analysis.");
      }

      setFileName("Previous Analysis Resume");

      // 2. Submit text to structure scanner API
      const scanRes = await fetch("/api/analyze/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const scanData = await scanRes.json();
      if (!scanRes.ok || !scanData.success) {
        throw new Error(scanData.error || "Failed to analyze layout structure");
      }

      setScannerData(scanData.data);
    } catch (err: any) {
      logger.error(err);
      setError(err.message || "Failed to run PDF structural scanner.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // Drag and drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setScannerData(null);
    setLoading(true);
    setScanStep(0);

    const interval = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, SCANNING_STEPS.length - 1));
    }, 1800);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/analyze/structure", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Structure scan failed");
      }

      setScannerData(data.data);
    } catch (err: any) {
      logger.error(err);
      setError(err.message || "Failed to analyze document structure.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  const handleReset = () => {
    setScannerData(null);
    setFileName(null);
    setError(null);
    // Remove query params from url history
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/dashboard/scanner");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="fade-up max-w-5xl mx-auto space-y-8">
        
        {/* Title */}
        {!scannerData && !loading && (
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink flex items-center gap-2 flex-wrap">
              PDF ATS-Compliance Heatmap & Structural Scanner 🔍
            </h1>
            <p className="text-ink-muted text-sm max-w-3xl">
              Upload your resume PDF to scan for common formatting issues that confuse applicant tracking system parsers. Get a visual heatmap of your document structure warnings.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading Step View */}
        {loading && (
          <div className="bg-paper-card border border-border rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 shadow-lg min-h-[280px] sm:min-h-[350px]">
            <span className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <h3 className="font-display text-lg font-bold text-ink mt-2">
              {SCANNING_STEPS[scanStep]}
            </h3>
            <p className="text-xs text-ink-muted">
              Analyzing font layers, headings, rating symbols, and column positions
            </p>
          </div>
        )}

        {/* Landing Dropzone View */}
        {!scannerData && !loading && (
          <div className="max-w-2xl mx-auto">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed border-border/80 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition bg-paper-card hover:bg-paper-warm hover:border-accent-border flex flex-col items-center justify-center min-h-[240px] sm:min-h-[300px] shadow-lg ${
                isDragActive ? "border-accent bg-accent/5" : ""
              }`}
            >
              <input {...getInputProps()} />
              <span className="text-5xl mb-4">📂</span>
              <h3 className="font-display text-lg font-bold text-ink mb-1.5">
                Drag and Drop Resume PDF here
              </h3>
              <p className="text-xs text-ink-muted mb-6">
                or click to select file from finder (A4 PDF format)
              </p>
              
              <div className="bg-paper border border-border/60 rounded-xl px-4 py-2 text-[10px] text-ink-muted uppercase font-bold tracking-wider">
                Only PDF documents supported
              </div>
            </div>
          </div>
        )}

        {/* Interactive Scorecard & Heatmap Board */}
        {scannerData && !loading && (
          <AtsScannerBoard
            data={scannerData}
            fileName={fileName || undefined}
            onClose={handleReset}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
