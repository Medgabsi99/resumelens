"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Puzzle,
  Download,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Copy,
  Check,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";

export default function ExtensionInstallationPage() {
  const [copiedPath, setCopiedPath] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText("c:\\Users\\LENOVO\\Documents\\resumelens\\extension");
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="workspace-canvas">
        <div style={{ maxWidth: 860, margin: "0 auto", color: "var(--ink)" }}>
          {/* Header Banner */}
          <div
            style={{
              borderRadius: 20,
              padding: "32px 36px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)",
              color: "white",
              boxShadow: "0 12px 36px rgba(139, 92, 246, 0.3)",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(6px)",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              <Puzzle size={14} />
              <span>Chrome Extension Package v1.0</span>
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                margin: "0 0 10px",
                letterSpacing: "-0.02em",
              }}
            >
              1-Click Job Clipper for Chrome &amp; Edge
            </h1>
            <p style={{ fontSize: 14, opacity: 0.9, margin: 0, maxWidth: 620, lineHeight: 1.6 }}>
              Clip job descriptions directly from LinkedIn, Indeed, Glassdoor, &amp; ZipRecruiter
              straight into your ResumeLens Application Tracker &amp; ATS Scanner.
            </p>
          </div>

          {/* Step-by-Step Installation Guide */}
          <div
            style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 28,
              marginBottom: 28,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: "0 0 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Zap size={18} style={{ color: "var(--accent)" }} />
              <span>How to Load the Extension into Chrome (Developer Mode)</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Step 1 */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Open Chrome Extensions Manager
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-muted)",
                      margin: "0 0 8px",
                      lineHeight: 1.5,
                    }}
                  >
                    In Google Chrome, navigate to{" "}
                    <code
                      style={{
                        background: "var(--paper-warm)",
                        border: "1px solid var(--border)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontFamily: "monospace",
                      }}
                    >
                      chrome://extensions
                    </code>{" "}
                    or click <strong>Settings &gt; Extensions &gt; Manage Extensions</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Enable "Developer mode"
                  </div>
                  <p
                    style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}
                  >
                    Toggle on the <strong>Developer mode</strong> switch in the top-right corner of
                    the Chrome Extensions page.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Click "Load unpacked" &amp; select the extension folder
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-muted)",
                      margin: "0 0 10px",
                      lineHeight: 1.5,
                    }}
                  >
                    Click the <strong>Load unpacked</strong> button in the top-left corner, and
                    select the folder path below:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "var(--paper-warm)",
                      border: "1px solid var(--border)",
                      padding: "8px 14px",
                      borderRadius: 8,
                    }}
                  >
                    <code
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "var(--ink)",
                        flex: 1,
                      }}
                    >
                      c:\Users\LENOVO\Documents\resumelens\extension
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      style={{
                        background: copiedPath ? "#dcfce7" : "var(--accent)",
                        color: copiedPath ? "#15803d" : "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {copiedPath ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedPath ? "Copied!" : "Copy Path"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
                <span>Supported Job Boards</span>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 13,
                  color: "var(--ink-muted)",
                  lineHeight: 1.7,
                }}
              >
                <li>LinkedIn Jobs (Unified &amp; Classic view)</li>
                <li>Indeed Job Postings</li>
                <li>Glassdoor Job Listings</li>
                <li>ZipRecruiter &amp; Generic Career Pages</li>
              </ul>
            </div>

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
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ShieldCheck size={16} style={{ color: "var(--accent)" }} />
                <span>Privacy &amp; Security</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                The extension only reads job posting text on active job board tabs when clicked. No
                personal data or browsing history is tracked or sent to third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
