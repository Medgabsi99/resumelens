"use client";

import React, { useState, useMemo } from "react";
import {
  detectAtsVendorFromUrl,
  detectAtsVendorFromCompany,
  ATS_VENDOR_SPECS,
  type AtsVendorId,
} from "@/lib/atsFingerprinter";
import {
  simulateAtsVendors,
  simulateVendorXRay,
  type AtsVendor,
  type AtsSimulatorResult,
  type VendorXRayResult,
} from "@/lib/atsSimulatorEngine";
import {
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Terminal,
  ShieldCheck,
  Zap,
  Info,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";

interface Props {
  resumeText: string;
  jobDescription?: string;
  initialJobUrl?: string;
  initialCompany?: string;
}

export default function AtsFingerprinterBoard({
  resumeText,
  jobDescription,
  initialJobUrl = "",
  initialCompany = "",
}: Props) {
  const [inputQuery, setInputQuery] = useState(initialJobUrl || initialCompany || "");
  const [activeVendor, setActiveVendor] = useState<AtsVendor>("greenhouse");
  const [activeTab, setActiveTab] = useState<"checks" | "xray" | "specs">("checks");

  // Run ATS simulation across all 8 vendors
  const simResult: AtsSimulatorResult = useMemo(() => {
    return simulateAtsVendors(resumeText, jobDescription);
  }, [resumeText, jobDescription]);

  // Fingerprint detection from search input
  const detectedAts = useMemo(() => {
    if (!inputQuery.trim()) {
      return null;
    }
    if (
      inputQuery.startsWith("http://") ||
      inputQuery.startsWith("https://") ||
      inputQuery.includes(".com") ||
      inputQuery.includes(".io") ||
      inputQuery.includes(".co")
    ) {
      return detectAtsVendorFromUrl(inputQuery);
    }
    return detectAtsVendorFromCompany(inputQuery);
  }, [inputQuery]);

  // When detected ATS changes, automatically focus that vendor
  const handleSelectDetected = () => {
    if (detectedAts) {
      setActiveVendor(detectedAts.vendorId);
    }
  };

  const activeProfile = simResult.profiles[activeVendor];
  const activeSpec = ATS_VENDOR_SPECS[activeVendor];

  // Run live X-Ray simulation
  const xrayResult: VendorXRayResult = useMemo(() => {
    return simulateVendorXRay(resumeText, activeVendor);
  }, [resumeText, activeVendor]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    return "text-rose-500 bg-rose-500/10 border-rose-500/30";
  };

  const getStatusIcon = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case "warn":
        return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
      case "fail":
        return <XCircle size={16} className="text-rose-500 shrink-0" />;
    }
  };

  return (
    <div className="w-full my-8 space-y-6">
      {/* ── Top Header & Fingerprint Search ───────────────────────── */}
      <SpotlightCard className="specular-border p-6 sm:p-8" specularBorder={true}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-2">
              <ShieldCheck size={13} className="text-accent" />
              <span>ATS Reverse-Engineering & Fingerprinter 2.0</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink tracking-tight">
              Company ATS Fingerprint & X-Ray Inspector
            </h3>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Detects which ATS processes your application and reverse-engineers parsing quirks for
              Workday, Greenhouse, Lever, Ashby, and more.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-paper-warm border border-border px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                Universal ATS Index
              </div>
              <div className="text-sm font-bold text-ink">
                {simResult.overallVendorScore}% Pass Probability
              </div>
            </div>
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-display text-lg font-bold border ${getScoreColor(
                simResult.overallVendorScore
              )}`}
            >
              {simResult.overallVendorScore}
            </div>
          </div>
        </div>

        {/* Search / URL Detection Input */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 bg-paper-card border border-border rounded-xl p-1.5 shadow-sm focus-within:border-accent">
            <div className="pl-3 text-ink-muted">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Paste a job posting URL (e.g. boards.greenhouse.io/stripe) or type a company name (e.g. Stripe, Figma, Netflix)..."
              className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm text-ink placeholder:text-ink-faint outline-none font-medium"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery("")}
                className="px-2 text-xs text-ink-muted hover:text-ink cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Real-time Detection Banner */}
        {detectedAts && (
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-sm"
                style={{ background: detectedAts.spec.accentColor }}
              >
                {detectedAts.spec.logoBadge}
              </div>
              <div>
                <div className="text-[11px] font-mono font-bold text-accent uppercase flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>Detected ATS: {detectedAts.vendorName}</span>
                  {detectedAts.matchedCompany && (
                    <span className="text-ink-muted">({detectedAts.matchedCompany})</span>
                  )}
                </div>
                <div className="text-xs text-ink-muted">
                  Engine: <strong className="text-ink">{detectedAts.spec.parserEngine}</strong> •{" "}
                  {detectedAts.spec.marketShare}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectDetected}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:bg-accent-hover transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>Inspect {detectedAts.spec.name} Quirks</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </SpotlightCard>

      {/* ── 8-Vendor Switcher Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(simResult.profiles) as AtsVendor[]).map((vId) => {
          const profile = simResult.profiles[vId];
          const spec = ATS_VENDOR_SPECS[vId];
          const isSelected = activeVendor === vId;

          return (
            <button
              key={vId}
              type="button"
              onClick={() => setActiveVendor(vId)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2.5 border ${
                isSelected
                  ? "bg-accent text-white border-accent shadow-md shadow-accent/15 scale-[1.02]"
                  : "bg-paper-card text-ink-muted hover:text-ink border-border hover:border-accent-border"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[9px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "text-white"
                }`}
                style={{ background: isSelected ? undefined : spec.accentColor }}
              >
                {spec.logoBadge}
              </span>
              <span>{spec.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : profile.matchScore >= 80
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : profile.matchScore >= 60
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {profile.matchScore}%
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active Vendor Deep Inspection Panel ────────────────────── */}
      <SpotlightCard className="specular-border p-6 sm:p-8" specularBorder={true}>
        {/* Vendor Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono text-base font-bold text-white shadow-sm"
              style={{ background: activeSpec.accentColor }}
            >
              {activeSpec.logoBadge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display text-xl font-bold text-ink">{activeSpec.name}</h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-paper-warm text-ink-muted border border-border">
                  {activeSpec.category}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">{activeSpec.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${getScoreColor(activeProfile.matchScore)}`}
            >
              {activeProfile.matchScore}% Compatibility ({activeProfile.parsingRisk})
            </div>
          </div>
        </div>

        {/* Sub-view Navigation Tabs (Checks vs X-Ray vs Specs) */}
        <div className="flex items-center gap-2 border-b border-border mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("checks")}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === "checks"
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Parsing Compliance Checks ({activeProfile.checks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("xray")}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === "xray"
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <Terminal size={14} />
            <span>Live ATS X-Ray Ingest Stream</span>
            {xrayResult.detectedAnomalies.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
                {xrayResult.detectedAnomalies.length} flags
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === "specs"
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <Zap size={14} />
            <span>Reverse-Engineered Insider Tips</span>
          </button>
        </div>

        {/* ── TAB 1: Compliance Checks ─────────────────────────────── */}
        {activeTab === "checks" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProfile.checks.map((check) => (
                <div
                  key={check.id}
                  className="p-4 rounded-xl border border-border bg-paper-warm/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.status)}
                        <span className="text-xs font-bold text-ink">{check.title}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-paper-card text-ink-muted border border-border">
                        {check.category}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed mb-3">
                      {check.description}
                    </p>
                  </div>

                  {check.status !== "pass" && (
                    <div className="pt-2.5 border-t border-border/60 text-[11px] text-accent font-medium flex items-start gap-1.5">
                      <span className="shrink-0">⚡ Fix:</span>
                      <span>{check.recommendation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: Live ATS X-Ray Ingest Stream ──────────────────── */}
        {activeTab === "xray" && (
          <div className="space-y-4">
            <div className="text-xs text-ink-muted flex items-center justify-between">
              <span>
                Raw extracted plaintext token stream as processed by{" "}
                <strong className="text-ink">{activeSpec.name}</strong> parser:
              </span>
              <span className="font-mono text-[11px]">
                {xrayResult.extractedSections.length} sections recognized •{" "}
                {xrayResult.extractedKeywords.length} keywords indexed
              </span>
            </div>

            {/* Terminal Window */}
            <div className="rounded-xl overflow-hidden border border-border bg-[#0d0d12] text-slate-200 font-mono text-xs shadow-inner">
              <div className="px-4 py-2 bg-[#181822] border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-slate-400 ml-2">
                    {activeVendor.toUpperCase()}_INGEST_BUFFER.log
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">● PARSER ACTIVE</span>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto space-y-4 leading-relaxed whitespace-pre-wrap select-text">
                {xrayResult.parsedStream ||
                  "// No resume text provided. Paste a resume to see X-Ray extraction."}
              </div>
            </div>

            {/* Anomaly Alerts */}
            {xrayResult.detectedAnomalies.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Detected Parsing Anomalies ({xrayResult.detectedAnomalies.length})</span>
                </div>
                {xrayResult.detectedAnomalies.map((a, i) => (
                  <div key={i} className="text-xs text-ink-muted flex items-start gap-2">
                    <span className="text-amber-500 shrink-0 font-bold">⚠️</span>
                    <span>
                      <strong className="text-ink">"{a.line}"</strong> — {a.warning}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Reverse-Engineered Insider Tips ────────────────── */}
        {activeTab === "specs" && (
          <div className="space-y-6">
            <div>
              <h5 className="text-xs font-mono font-bold uppercase text-accent tracking-wider mb-2">
                Known Parsing Peculiarities & Algorithms:
              </h5>
              <div className="space-y-2">
                {activeSpec.parsingPeculiarities.map((pec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-paper-warm/50 border border-border text-xs text-ink-muted leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-accent font-bold">0{i + 1}.</span>
                    <span>{pec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mb-2">
                Recommended Strategy for 100% Pass Rate:
              </h5>
              <div className="space-y-2">
                {activeSpec.recommendedStrategy.map((strat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/20 text-xs text-ink leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{strat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
