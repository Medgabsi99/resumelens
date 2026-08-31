"use client";

import React, { useState, useMemo } from "react";
import {
  simulateAtsVendors,
  simulateVendorXRay,
  type AtsVendor,
  type AtsVendorProfile,
  type AtsSimulatorResult,
  type VendorXRayResult,
} from "@/lib/atsSimulatorEngine";
import { ATS_VENDOR_SPECS } from "@/lib/atsFingerprinter";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Zap,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Terminal,
} from "lucide-react";
import SpotlightCard from "../SpotlightCard";

interface Props {
  resumeText: string;
  jobDescription?: string;
  onApplyFixes?: () => void;
}

export default function AtsVendorSimulator({ resumeText, jobDescription, onApplyFixes }: Props) {
  const result: AtsSimulatorResult = useMemo(() => {
    return simulateAtsVendors(resumeText, jobDescription);
  }, [resumeText, jobDescription]);

  const [activeVendor, setActiveVendor] = useState<AtsVendor>("workday");
  const [viewMode, setViewMode] = useState<"audits" | "xray" | "specs">("audits");

  const activeProfile: AtsVendorProfile = result.profiles[activeVendor];
  const activeSpec = ATS_VENDOR_SPECS[activeVendor];

  const xrayResult: VendorXRayResult = useMemo(() => {
    return simulateVendorXRay(resumeText, activeVendor);
  }, [resumeText, activeVendor]);

  const handleApplyFixes = () => {
    if (onApplyFixes) {
      onApplyFixes();
    } else {
      const el = document.getElementById("areas-to-improve-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getStatusIcon = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
      case "warn":
        return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
      case "fail":
        return <XCircle size={16} className="text-rose-400 shrink-0" />;
    }
  };

  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "24px 28px",
        marginTop: 24,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
      }}
      className="transition-all duration-300"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-accent-bg text-accent">
              <Building2 size={20} />
            </span>
            <h3 className="font-display text-xl font-bold text-ink">
              Executive ATS Vendor Match Simulator (8 Platforms)
            </h3>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Simulates parsing compatibility and failure risks across Workday, Greenhouse, Lever,
            Ashby, Taleo, and more.
          </p>
        </div>

        {/* Overall Average Rating Badge */}
        <div className="flex items-center gap-3 bg-paper border border-border px-4 py-2.5 rounded-2xl shadow-sm">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
              Multi-ATS Index
            </div>
            <div className="text-sm font-bold text-ink">
              {result.overallVendorScore}% Universal Match
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-display text-lg font-bold border ${getScoreColor(
              result.overallVendorScore
            )}`}
          >
            {result.overallVendorScore}
          </div>
        </div>
      </div>

      {/* ── Vendor Selector Tabs Grid (8 Vendors) ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
        {(Object.keys(result.profiles) as AtsVendor[]).map((vKey) => {
          const profile = result.profiles[vKey];
          const spec = ATS_VENDOR_SPECS[vKey];
          const isSelected = activeVendor === vKey;
          return (
            <button
              key={vKey}
              type="button"
              onClick={() => setActiveVendor(vKey)}
              style={{
                borderColor: isSelected ? spec.accentColor : "var(--border)",
                background: isSelected ? "var(--paper)" : "transparent",
              }}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200 hover:border-accent cursor-pointer ${
                isSelected ? "shadow-md ring-1 ring-accent-border scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span
                  style={{ background: spec.accentColor }}
                  className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded font-mono"
                >
                  {profile.logoBadge}
                </span>
                <span
                  className={`text-[11px] font-bold font-mono px-1 py-0.2 rounded ${getScoreColor(
                    profile.matchScore
                  )}`}
                >
                  {profile.matchScore}%
                </span>
              </div>
              <div className="text-[11px] font-bold text-ink truncate w-full">{profile.name}</div>
              <div className="text-[9px] text-ink-faint truncate w-full mt-0.5">
                {profile.parsingRisk}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Active Vendor Deep-Dive Box ───────────────────── */}
      <div className="bg-paper border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span
              style={{ background: activeSpec.accentColor }}
              className="text-sm font-extrabold text-white px-3 py-1 rounded-lg font-mono"
            >
              {activeProfile.logoBadge}
            </span>
            <div>
              <h4 className="font-display text-lg font-bold text-ink">
                {activeProfile.name} Profile
              </h4>
              <div className="text-xs font-mono text-ink-faint">
                Market Adoption: {activeProfile.marketShare}
              </div>
            </div>
          </div>

          {/* Sub-view Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("audits")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                viewMode === "audits"
                  ? "bg-accent text-white border-accent"
                  : "bg-paper-card text-ink-muted border-border"
              }`}
            >
              Audits ({activeProfile.checks.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("xray")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                viewMode === "xray"
                  ? "bg-accent text-white border-accent"
                  : "bg-paper-card text-ink-muted border-border"
              }`}
            >
              <Terminal size={12} />
              <span>ATS X-Ray</span>
              {xrayResult.detectedAnomalies.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("specs")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                viewMode === "specs"
                  ? "bg-accent text-white border-accent"
                  : "bg-paper-card text-ink-muted border-border"
              }`}
            >
              Insider Tips
            </button>
          </div>
        </div>

        <p className="text-xs text-ink-muted leading-relaxed mb-5 italic bg-paper-card p-3 rounded-xl border border-border">
          💡 <strong>Engine Architecture:</strong> {activeProfile.summary}
        </p>

        {/* ── View Mode 1: Audits ───────────────────────────── */}
        {viewMode === "audits" && (
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-ink-faint font-bold">
              Platform Parsing Audits ({activeProfile.checks.length})
            </div>

            {activeProfile.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-paper-card hover:bg-paper transition"
              >
                {getStatusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-bold text-ink">{check.title}</div>
                    <span className="text-[10px] font-mono text-ink-faint uppercase bg-paper px-2 py-0.5 rounded border border-border">
                      {check.category}
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted leading-relaxed mb-2">
                    {check.description}
                  </div>
                  {check.status !== "pass" && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <Sparkles size={13} className="shrink-0 text-amber-500" />
                      <span>
                        <strong>Recommended Fix:</strong> {check.recommendation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── View Mode 2: X-Ray Terminal ───────────────────── */}
        {viewMode === "xray" && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-border bg-[#0d0d12] text-slate-200 font-mono text-xs shadow-inner">
              <div className="px-3.5 py-2 bg-[#181822] border-b border-border/40 flex items-center justify-between text-[11px] text-slate-400">
                <span>{activeVendor.toUpperCase()}_PARSER_INGEST.raw</span>
                <span className="text-emerald-400 font-bold">● INGEST BUFFER</span>
              </div>
              <div className="p-4 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                {xrayResult.parsedStream}
              </div>
            </div>

            {xrayResult.detectedAnomalies.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                  ⚠️ Detected Ingest Flags ({xrayResult.detectedAnomalies.length})
                </div>
                {xrayResult.detectedAnomalies.map((a, i) => (
                  <div key={i} className="text-ink-muted text-[11px]">
                    • <strong className="text-ink">"{a.line}"</strong> — {a.warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── View Mode 3: Insider Specs ────────────────────── */}
        {viewMode === "specs" && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="font-mono font-bold uppercase text-accent mb-2">
                Reverse-Engineered Quirks:
              </div>
              <div className="space-y-1.5">
                {activeSpec.parsingPeculiarities.map((p, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-paper-card border border-border text-ink-muted leading-relaxed"
                  >
                    <strong>0{i + 1}.</strong> {p}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                Optimal Passing Strategy:
              </div>
              <div className="space-y-1.5">
                {activeSpec.recommendedStrategy.map((s, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-ink leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Universal Optimization Summary ───────────────── */}
      {result.universalFixesCount > 0 && (
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-accent/10 via-blue-500/10 to-emerald-500/10 border border-accent/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent text-white shadow-md">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">
                {result.universalFixesCount} Quick Fixes Available
              </div>
              <div className="text-[11px] text-ink-muted">
                Resolving these flags boosts your score across Workday, Greenhouse, Lever, Ashby,
                and Taleo simultaneously.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyFixes}
            className="text-xs font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl no-underline shadow-sm transition-transform hover:scale-105 shrink-0 cursor-pointer border-none"
          >
            Apply Fixes in Editor →
          </button>
        </div>
      )}
    </div>
  );
}
