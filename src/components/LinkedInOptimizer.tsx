"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Sparkles,
  Search,
  Eye,
  Award,
  Zap,
} from "lucide-react";

function Linkedin({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}
import { auditLinkedInProfile, type LinkedInAuditResult } from "@/lib/linkedinOptimizer";

interface Props {
  defaultRole?: string;
  defaultJobDescription?: string;
}

export default function LinkedInOptimizer({ defaultRole, defaultJobDescription }: Props) {
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [targetRole, setTargetRole] = useState(defaultRole || "");
  const [copiedHeadline, setCopiedHeadline] = useState<number | null>(null);
  const [copiedAbout, setCopiedAbout] = useState(false);

  const audit: LinkedInAuditResult = auditLinkedInProfile(
    headline,
    about,
    targetRole,
    defaultJobDescription
  );

  const scoreColor =
    audit.seoScore >= 80 ? "#16a34a" : audit.seoScore >= 60 ? "#d97706" : "#dc2626";

  const handleCopyHeadline = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHeadline(index);
    setTimeout(() => setCopiedHeadline(null), 2000);
  };

  const handleCopyAbout = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAbout(true);
    setTimeout(() => setCopiedAbout(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 0" }}>
      {/* Header Banner */}
      <div
        style={{
          borderRadius: 16,
          padding: "24px 28px",
          background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 8px 24px rgba(10, 102, 194, 0.25)",
        }}
      >
        <div style={{ maxWidth: 500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Linkedin size={24} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
              LinkedIn Profile Optimizer
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
            Rank higher in recruiter searches (LinkedIn Recruiter Lite algorithm). Optimize your
            Headline &amp; About section for instant recruiter callbacks.
          </p>
        </div>

        {/* Score Pill */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: 16,
            padding: "14px 24px",
            textAlign: "center",
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.8,
            }}
          >
            LinkedIn SEO Score
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, marginTop: 2 }}>{audit.seoScore}/100</div>
        </div>
      </div>

      {/* Inputs Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left Column: Target Role & Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Target Job Title
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                LinkedIn Headline
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: headline.length > 220 ? "#dc2626" : "var(--ink-muted)",
                }}
              >
                {headline.length}/220 chars
              </span>
            </div>
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              rows={3}
              placeholder="Paste your current LinkedIn headline here..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: 13,
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        {/* Right Column: About Section */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
              LinkedIn About / Summary Section
            </label>
            <span
              style={{ fontSize: 11, color: about.length > 2600 ? "#dc2626" : "var(--ink-muted)" }}
            >
              {about.length}/2600 chars
            </span>
          </div>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={7}
            placeholder="Paste your LinkedIn About / Summary text here..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: 13,
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>
      </div>

      {/* Recruiter Search Signals Grid */}
      <div
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Search size={16} style={{ color: "#0a66c2" }} />
          <span>Recruiter Search (LinkedIn Recruiter Lite Signals)</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {audit.recruiterSearchSignals.map((sig, i) => (
            <div
              key={i}
              style={{
                borderRadius: 10,
                padding: "12px 14px",
                border: `1px solid ${sig.status === "fail" ? "rgba(239,68,68,0.3)" : sig.status === "warn" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.25)"}`,
                background:
                  sig.status === "fail"
                    ? "rgba(239,68,68,0.06)"
                    : sig.status === "warn"
                      ? "rgba(245,158,11,0.06)"
                      : "rgba(16,185,129,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                  {sig.signal}
                </span>
                {sig.status === "pass" ? (
                  <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
                ) : sig.status === "warn" ? (
                  <AlertTriangle size={15} style={{ color: "#d97706" }} />
                ) : (
                  <XCircle size={15} style={{ color: "#dc2626" }} />
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.4 }}>
                {sig.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Headlines */}
      <div
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={16} style={{ color: "#0a66c2" }} />
          <span>High-Ranking Headline Formulas (Click to Copy)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {audit.headline.suggestedHeadlines.map((sh, idx) => (
            <div
              key={idx}
              style={{
                borderRadius: 10,
                padding: "12px 16px",
                border: "1px solid var(--border)",
                background: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ink)",
                  fontWeight: 500,
                  fontFamily: "monospace",
                }}
              >
                {sh}
              </span>
              <button
                type="button"
                onClick={() => handleCopyHeadline(sh, idx)}
                style={{
                  background: copiedHeadline === idx ? "#dcfce7" : "#0a66c2",
                  color: copiedHeadline === idx ? "#15803d" : "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {copiedHeadline === idx ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedHeadline === idx ? "Copied!" : "Use Headline"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested About Template */}
      <div
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Award size={16} style={{ color: "#0a66c2" }} />
            <span>High-Converting About Section Template</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyAbout(audit.about.suggestedAbout)}
            style={{
              background: copiedAbout ? "#dcfce7" : "#0a66c2",
              color: copiedAbout ? "#15803d" : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {copiedAbout ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedAbout ? "Copied to Clipboard!" : "Copy About Template"}</span>
          </button>
        </div>

        <pre
          style={{
            margin: 0,
            padding: 16,
            borderRadius: 10,
            background: "var(--paper-warm)",
            border: "1px solid var(--border)",
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--ink)",
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
          }}
        >
          {audit.about.suggestedAbout}
        </pre>
      </div>
    </div>
  );
}
