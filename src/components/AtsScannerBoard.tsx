"use client";

import { useState } from "react";
import { type AtsStructureResult, type AtsZoneHighlight } from "@/lib/ai";
import SpotlightCard from "./SpotlightCard";

interface Props {
  data: AtsStructureResult;
  fileName?: string;
  onClose: () => void;
}

export default function AtsScannerBoard({ data, onClose }: Props) {
  const [activeHighlight, setActiveHighlight] = useState<AtsZoneHighlight | null>(
    data.highlightedZones.length > 0 ? data.highlightedZones[0] : null
  );

  const getStatusColor = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "warn":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "fail":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    }
  };

  const getStatusIcon = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass":
        return "✓";
      case "warn":
        return "⚠";
      case "fail":
        return "✗";
    }
  };

  const getSeverityColor = (sev: "info" | "warn" | "error") => {
    switch (sev) {
      case "info":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "warn":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "error":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    }
  };

  // Find highlight by zone
  const getHighlightForZone = (zoneName: string) => {
    return data.highlightedZones.find((h) => h.zone === zoneName);
  };

  // Score details
  const scoreColor =
    data.atsScore >= 80 ? "text-emerald-400" : data.atsScore >= 60 ? "text-amber-400" : "text-rose-400";
  
  const scoreBorderColor =
    data.atsScore >= 80 ? "border-emerald-500" : data.atsScore >= 60 ? "border-amber-500" : "border-rose-500";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in text-slate-100 font-sans">
      
      {/* Visual Heatmap Mockup Resume Page */}
      <div className="w-full lg:w-[480px] shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider">
            📄 Interactive Layout Heatmap
          </h3>
          <span className="text-xs text-ink-faint italic">Hover highlighted zones to inspect</span>
        </div>

        <div className="relative border border-border bg-slate-900 rounded-2xl p-6 shadow-2xl aspect-[1/1.4] w-full overflow-hidden flex flex-col justify-between">
          
          {/* Header check zone */}
          <div 
            onMouseEnter={() => {
              const h = getHighlightForZone("header");
              if (h) setActiveHighlight(h);
            }}
            className={`relative p-3 rounded-lg border border-dashed transition-all duration-300 ${
              getHighlightForZone("header")
                ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 cursor-help"
                : "border-border/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-4 w-24 bg-slate-700/60 rounded" />
              <div className="h-3 w-32 bg-slate-700/40 rounded" />
            </div>
            <div className="flex gap-2 text-[10px] text-slate-500">
              <div className="h-3 w-16 bg-slate-700/40 rounded" />
              <span>•</span>
              <div className="h-3 w-20 bg-slate-700/40 rounded" />
            </div>
            
            {getHighlightForZone("header") && (
              <div className="absolute inset-0 bg-rose-500/10 border-2 border-rose-500 border-dashed rounded animate-pulse opacity-70 hover:opacity-100 transition-opacity" />
            )}
          </div>

          {/* Heading zone & Column Layout zone */}
          <div className="flex-1 flex gap-4 my-4 overflow-hidden">
            
            {/* Left Column or sidebar mock */}
            <div 
              onMouseEnter={() => {
                const h = getHighlightForZone("columns");
                if (h) setActiveHighlight(h);
              }}
              className={`relative w-1/3 p-3 rounded-lg border border-dashed flex flex-col gap-3 transition-all duration-300 ${
                getHighlightForZone("columns")
                  ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-help"
                  : "border-border/40"
              }`}
            >
              <div className="h-4 w-12 bg-slate-700/60 rounded" />
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-700/40 rounded" />
                <div className="h-2 w-5/6 bg-slate-700/40 rounded" />
                <div className="h-2 w-4/5 bg-slate-700/40 rounded" />
              </div>
              
              {/* Ratings Zone */}
              <div 
                onMouseEnter={(e) => {
                  const h = getHighlightForZone("ratings");
                  if (h) {
                    e.stopPropagation(); // Stop parent columns trigger
                    setActiveHighlight(h);
                  }
                }}
                className={`relative p-2 rounded border border-dashed flex flex-col gap-2 ${
                  getHighlightForZone("ratings")
                    ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 cursor-help"
                    : "border-transparent"
                }`}
              >
                <div className="h-3 w-10 bg-slate-700/60 rounded" />
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-slate-600" />
                  <div className="h-2 w-2 rounded-full bg-slate-600" />
                  <div className="h-2 w-2 rounded-full bg-slate-600" />
                  <div className="h-2 w-2 rounded-full bg-slate-700" />
                  <div className="h-2 w-2 rounded-full bg-slate-700" />
                </div>
                {getHighlightForZone("ratings") && (
                  <div className="absolute inset-0 bg-rose-500/15 border border-rose-500 border-dashed rounded" />
                )}
              </div>

              {getHighlightForZone("columns") && (
                <div className="absolute inset-0 bg-amber-500/10 border-2 border-amber-500 border-dashed rounded animate-pulse opacity-70 hover:opacity-100 transition-opacity" />
              )}
            </div>

            {/* Right Column / Body Content mock */}
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Heading Checker zone */}
              <div 
                onMouseEnter={() => {
                  const h = getHighlightForZone("headings");
                  if (h) setActiveHighlight(h);
                }}
                className={`relative p-2.5 rounded-lg border border-dashed flex flex-col gap-2 transition-all duration-300 ${
                  getHighlightForZone("headings")
                    ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-help"
                    : "border-border/40"
                }`}
              >
                <div className="h-4 w-28 bg-slate-700/70 rounded" />
                <div className="space-y-1">
                  <div className="h-2.5 w-1/2 bg-slate-700/60 rounded" />
                  <div className="h-2 w-full bg-slate-700/40 rounded" />
                  <div className="h-2 w-full bg-slate-700/40 rounded" />
                </div>
                {getHighlightForZone("headings") && (
                  <div className="absolute inset-0 bg-amber-500/10 border-2 border-amber-500 border-dashed rounded animate-pulse opacity-70 hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Tables Checker zone */}
              <div 
                onMouseEnter={() => {
                  const h = getHighlightForZone("tables");
                  if (h) setActiveHighlight(h);
                }}
                className={`relative p-2.5 rounded-lg border border-dashed flex flex-col gap-2 transition-all duration-300 ${
                  getHighlightForZone("tables")
                    ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 cursor-help"
                    : "border-border/40"
                }`}
              >
                <div className="h-4 w-16 bg-slate-700/70 rounded" />
                <div className="border border-slate-700/50 rounded overflow-hidden">
                  <div className="grid grid-cols-2 bg-slate-800/30 p-1.5 border-b border-slate-700/50">
                    <div className="h-2 w-10 bg-slate-700/60 rounded" />
                    <div className="h-2 w-12 bg-slate-700/60 rounded" />
                  </div>
                  <div className="grid grid-cols-2 p-1.5">
                    <div className="h-2 w-8 bg-slate-700/40 rounded" />
                    <div className="h-2 w-10 bg-slate-700/40 rounded" />
                  </div>
                </div>
                {getHighlightForZone("tables") && (
                  <div className="absolute inset-0 bg-rose-500/10 border-2 border-rose-500 border-dashed rounded animate-pulse opacity-70 hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Graphics Checker zone */}
              <div 
                onMouseEnter={() => {
                  const h = getHighlightForZone("graphics");
                  if (h) setActiveHighlight(h);
                }}
                className={`relative p-2.5 rounded-lg border border-dashed flex items-center justify-between transition-all duration-300 ${
                  getHighlightForZone("graphics")
                    ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-help"
                    : "border-border/40"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-16 bg-slate-700/60 rounded" />
                  <div className="h-2 w-28 bg-slate-700/40 rounded" />
                </div>
                <div className="h-8 w-8 bg-slate-700/50 rounded-full shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">📷</span>
                </div>
                {getHighlightForZone("graphics") && (
                  <div className="absolute inset-0 bg-amber-500/10 border-2 border-amber-500 border-dashed rounded animate-pulse opacity-70 hover:opacity-100 transition-opacity" />
                )}
              </div>

            </div>

          </div>

          {/* Footer dummy text line */}
          <div className="h-3 w-1/3 bg-slate-700/20 rounded mx-auto mt-2" />

        </div>
      </div>

      {/* Checklist & Results Panel */}
      <div className="flex-1 space-y-6 w-full">
        
        {/* Score & General summary */}
        <SpotlightCard className="bg-paper-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg">
          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            <div className="absolute inset-2 rounded-full bg-slate-900 border-4 border-border/20" />
            <div className={`absolute inset-2 rounded-full border-4 ${scoreBorderColor} border-t-transparent animate-spin [animation-duration:3s] opacity-20`} />
            <div className="z-10 text-center">
              <span className={`text-4xl font-extrabold ${scoreColor}`}>{data.atsScore}</span>
              <span className="text-[9px] text-ink-muted uppercase font-bold tracking-widest block mt-0.5">SCORE</span>
            </div>
          </div>

          <div className="space-y-2 text-center md:text-left flex-1">
            <h3 className="font-display text-xl font-bold text-ink">
              ATS Formatting Scanner
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Overall formatting rate matches <span className="font-semibold">{data.atsScore}%</span>. We found <span className="font-semibold text-rose-400">{data.highlightedZones.length} structural items</span> that might impede standard parser compatibility.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-paper border border-border text-ink hover:bg-paper-warm rounded-xl text-sm font-semibold transition shrink-0 cursor-pointer"
          >
            ← Back
          </button>
        </SpotlightCard>

        {/* Structured Checklist Grid */}
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">
            ✓ Technical Checklist Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "singleColumn", label: "Single-Column Alignment" },
              { key: "textExtractable", label: "Text Layer Extractability" },
              { key: "headerFooterSafety", label: "Header & Footer Safety" },
              { key: "tableTextboxSafety", label: "Table & Textbox Safety" },
              { key: "headingsStandard", label: "Section Headings standard" },
              { key: "graphicalElements", label: "No graphical ratings/bars" },
            ].map((check) => {
              const val = (data.checklist as Record<string, unknown>)[check.key];
              if (!val) return null;
              return (
                <SpotlightCard
                  key={check.key}
                  className="bg-paper border border-border rounded-xl p-4 flex gap-3.5 items-start"
                >
                  <span className={`w-6 h-6 rounded-lg font-bold text-sm flex items-center justify-center border shrink-0 ${getStatusColor(val.status)}`}>
                    {getStatusIcon(val.status)}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink leading-tight">{check.label}</h4>
                    <p className="text-xs text-ink-muted mt-1 leading-normal">{val.details}</p>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* Active Inspection Detail Card */}
        {activeHighlight && (
          <SpotlightCard className="bg-paper-card border border-border rounded-2xl p-5 space-y-3.5 shadow-lg border-l-4 border-l-accent animate-scale-up">
            <div className="flex justify-between items-center">
              <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                🔎 Active Zone Inspection: <span className="text-accent capitalize">{activeHighlight.zone}</span>
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(activeHighlight.severity)}`}>
                {activeHighlight.severity}
              </span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-ink-faint font-bold uppercase tracking-widest block">Issue Identified</span>
              <p className="text-sm text-ink font-medium leading-relaxed">{activeHighlight.message}</p>
            </div>

            <div className="bg-paper border border-border/60 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">Actionable Remedy</span>
              <p className="text-xs text-ink-muted leading-relaxed">{activeHighlight.remedy}</p>
            </div>
          </SpotlightCard>
        )}

      </div>

    </div>
  );
}
