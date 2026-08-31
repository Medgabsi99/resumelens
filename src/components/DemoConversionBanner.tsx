"use client";

import React from "react";
import { Sparkles, ArrowRight, X, Play, ShieldCheck } from "lucide-react";
import { DEMO_ARCHETYPES, type DemoArchetype } from "@/lib/sampleDemoData";

interface Props {
  activeArchetype: "swe" | "pm" | "ml";
  onSelectArchetype: (key: "swe" | "pm" | "ml") => void;
  onExitDemo: () => void;
  onUploadOwn: () => void;
}

export default function DemoConversionBanner({
  activeArchetype,
  onSelectArchetype,
  onExitDemo,
  onUploadOwn,
}: Props) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
        border: "1px solid rgba(249, 115, 22, 0.35)",
        borderRadius: 20,
        padding: "16px 20px",
        marginBottom: 24,
        boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.25), 0 0 0 1px rgba(255,255,255,0.05)",
        color: "white",
        backdropFilter: "blur(12px)",
      }}
      className="animate-fadeIn"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Side: Badge & Info */}
        <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(249, 115, 22, 0.2)",
              color: "#fb923c",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "DM Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>Interactive Sample Demo</span>
          </span>

          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            Explore live ATS score breakdowns, heatmaps, and bullet rewrites without uploading.
          </span>
        </div>

        {/* Right Side: Primary CTA & Exit */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <button
            onClick={onUploadOwn}
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "8px 18px",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
              transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
              fontFamily: "Instrument Sans, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            <span>Scan My Own Resume Free</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onExitDemo}
            title="Exit Demo"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#94a3b8",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 10,
              padding: "7px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <X size={13} />
            <span>Exit Demo</span>
          </button>
        </div>
      </div>

      {/* Role Archetype Tabs */}
      <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          Switch Demo Track:
        </span>
        {(Object.keys(DEMO_ARCHETYPES) as Array<"swe" | "pm" | "ml">).map((key) => {
          const item = DEMO_ARCHETYPES[key];
          const isSelected = activeArchetype === key;
          return (
            <button
              key={key}
              onClick={() => onSelectArchetype(key)}
              style={{
                background: isSelected ? "rgba(249, 115, 22, 0.25)" : "rgba(255, 255, 255, 0.05)",
                color: isSelected ? "#fb923c" : "#cbd5e1",
                border: `1px solid ${isSelected ? "rgba(249, 115, 22, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: 10,
                padding: "5px 12px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{item.name}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: isSelected ? "rgba(249, 115, 22, 0.3)" : "rgba(0,0,0,0.2)",
                  color: isSelected ? "#fff" : "#94a3b8",
                  fontFamily: "DM Mono, monospace",
                  fontWeight: 800,
                }}
              >
                {item.result.score}/100
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
