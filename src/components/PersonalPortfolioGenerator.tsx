"use client";
import { logger } from "@/lib/logger";

import { useState, useEffect, useMemo } from "react";
import { PortfolioData } from "@/lib/ai";
import { generatePortfolioHtml } from "@/lib/portfolioTemplate";

interface Props {
  analysisId: string;
  resumeText: string;
}

type ThemeType = "modern-dark" | "minimal-light" | "creative-neon" | "warm-professional";

const THEMES: { id: ThemeType; label: string; colors: string[] }[] = [
  { id: "modern-dark", label: "Modern Dark", colors: ["#090d16", "#8b5cf6"] },
  { id: "minimal-light", label: "Minimal Light", colors: ["#fafaf9", "#1c1917"] },
  { id: "creative-neon", label: "Creative Neon", colors: ["#09090b", "#10b981"] },
  { id: "warm-professional", label: "Warm Professional", colors: ["#fafaf9", "#064e3b"] },
];

export default function PersonalPortfolioGenerator({ analysisId, resumeText }: Props) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("modern-dark");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  
  // Collapse state for forms
  const [expandedSection, setExpandedSection] = useState<string | null>("hero");

  // Fetch saved portfolio on mount
  useEffect(() => {
    async function loadPortfolio() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/portfolio?analysisId=${analysisId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setPortfolioData(data.data.content);
          setSelectedTheme(data.data.theme as ThemeType);
        }
      } catch (err: unknown) {
        logger.error("Failed to load portfolio:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortfolio();
  }, [analysisId]);

  // Generate initial content with AI
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");
      
      setPortfolioData(data.data);
      // Try to save generated content immediately
      await savePortfolio(selectedTheme, data.data);
    } catch (err: unknown) {
      setError((err as Error).message || "Could not generate portfolio copy.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save/Upsert portfolio
  const savePortfolio = async (themeToSave: ThemeType, dataToSave: PortfolioData) => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          theme: themeToSave,
          content: dataToSave,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      setSaveStatus("✓ Changes saved successfully");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!portfolioData) return;
    savePortfolio(selectedTheme, portfolioData);
  };

  // Switch Theme & auto save if portfolio exists
  const handleThemeChange = (theme: ThemeType) => {
    setSelectedTheme(theme);
    if (portfolioData) {
      savePortfolio(theme, portfolioData);
    }
  };

  // Update a single text field in portfolio copy
  const updateField = (field: keyof PortfolioData, value: string | string[] | Record<string, unknown>) => {
    if (!portfolioData) return;
    setPortfolioData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Generate responsive iframe string
  const iframeSrcDoc = useMemo(() => {
    if (!portfolioData) return "";
    return generatePortfolioHtml(portfolioData, selectedTheme);
  }, [portfolioData, selectedTheme]);

  // Download compiled HTML file
  const handleDownload = () => {
    if (!portfolioData) return;
    const html = generatePortfolioHtml(portfolioData, selectedTheme);
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const nameSlug = portfolioData.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.href = url;
    a.download = `${nameSlug}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div
        style={{
          background: "var(--paper-card)",
          border: "1.5px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          marginTop: "16px",
        }}
      >
        {/* Shimmer header */}
        <div
          className="skeleton"
          style={{ height: 58, borderRadius: 0, borderBottom: "1px solid var(--border)" }}
        />
        {/* Shimmer body */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 420 }}>
          <div
            style={{
              borderRight: "1px solid var(--border)",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[80, 100, 60, 90, 70].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: i === 1 ? 72 : 14, width: `${w}%`, borderRadius: 8 }} />
            ))}
          </div>
          <div className="skeleton" style={{ margin: 16, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--paper-card)",
      border: "1.5px solid var(--border)",
      borderRadius: "16px",
      overflow: "hidden",
      marginTop: "16px",
    }}>
      {/* Title Header */}
      <div style={{
        padding: "18px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--accent-bg)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "Instrument Sans, sans-serif",
          }}>
            Personal Portfolio Site Generator 🌐
          </h3>
          <p style={{
            margin: "2px 0 0 0",
            fontSize: "11px",
            color: "var(--ink-muted)",
          }}>
            Transform your resume achievements into a beautiful, static web page copy and responsive showcase.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {portfolioData && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleDownload}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px var(--brand-glow)",
                }}
              >
                ↓ Download HTML File
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid Workspace */}
      {!portfolioData ? (
        <div style={{
          padding: "48px 24px",
          textAlign: "center",
          background: "var(--paper-warm)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            fontSize: "36px",
            marginBottom: "16px",
          }}>
            🌐
          </div>
          <h4 style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--ink)",
          }}>
            Generate Your Online Brand
          </h4>
          <p style={{
            margin: "0 0 24px 0",
            fontSize: "13px",
            color: "var(--ink-muted)",
            maxWidth: "480px",
            lineHeight: 1.6,
          }}>
            Gemini will analyze your work experience, metrics, and skills to write high-impact headlines, formatted bios, and project portfolios optimized for the web.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 24px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: isGenerating ? 0.8 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
                Writing Portfolio Site...
              </>
            ) : (
              <>
                ✨ Generate Portfolio Content
              </>
            )}
          </button>
          {error && (
            <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "12px", fontWeight: 500 }}>
              ⚠ {error}
            </p>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "350px 1fr",
          background: "var(--paper)",
          minHeight: "580px",
        }}>
          {/* Left panel: Config controls */}
          <div style={{
            borderRight: "1px solid var(--border)",
            padding: "20px 16px",
            background: "var(--paper-card)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
            maxHeight: "700px",
          }}>
            {/* Theme Preset selector */}
            <div>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--ink-muted)",
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "8px",
              }}>
                🎨 Theme Preset
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {THEMES.map((theme) => {
                  const active = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        background: active ? "var(--accent-bg)" : "var(--paper)",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        gap: "3px",
                      }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: theme.colors[0], border: "1px solid var(--border)" }} />
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: theme.colors[1] }} />
                      </div>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: active ? 700 : 500,
                        color: active ? "var(--accent)" : "var(--ink)",
                      }}>
                        {theme.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid var(--border)" }} />

            {/* Editable Content Copy Panels */}
            <div>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--ink-muted)",
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "10px",
              }}>
                📝 Edit Content Copy
              </label>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* 1. Hero & Branding */}
                <CollapsibleSection
                  title="Branding & Hero"
                  isOpen={expandedSection === "hero"}
                  onToggle={() => setExpandedSection(expandedSection === "hero" ? null : "hero")}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Full Name</span>
                      <input
                        type="text"
                        value={portfolioData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Headline Headline</span>
                      <input
                        type="text"
                        value={portfolioData.headline}
                        onChange={(e) => updateField("headline", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Subheading Description</span>
                      <textarea
                        value={portfolioData.subheading}
                        onChange={(e) => updateField("subheading", e.target.value)}
                        style={{ ...inputStyle, height: "60px", resize: "none" }}
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 2. About Me */}
                <CollapsibleSection
                  title="About Bio"
                  isOpen={expandedSection === "about"}
                  onToggle={() => setExpandedSection(expandedSection === "about" ? null : "about")}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Professional Bio</span>
                      <textarea
                        value={portfolioData.aboutMe}
                        onChange={(e) => updateField("aboutMe", e.target.value)}
                        style={{ ...inputStyle, height: "120px", resize: "vertical" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Contact Email</span>
                      <input
                        type="email"
                        value={portfolioData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 3. Links */}
                <CollapsibleSection
                  title="Social Links"
                  isOpen={expandedSection === "links"}
                  onToggle={() => setExpandedSection(expandedSection === "links" ? null : "links")}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>GitHub Profile URL</span>
                      <input
                        type="text"
                        value={portfolioData.githubUrl || ""}
                        onChange={(e) => updateField("githubUrl", e.target.value)}
                        placeholder="https://github.com/username"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>LinkedIn Profile URL</span>
                      <input
                        type="text"
                        value={portfolioData.linkedinUrl || ""}
                        onChange={(e) => updateField("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Regenerate Trigger */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  style={{
                    background: "transparent",
                    color: "var(--accent)",
                    border: "1.5px solid var(--accent-border)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    opacity: isGenerating ? 0.7 : 1,
                  }}
                >
                  🔄 Regenerate copy with AI
                </button>
              </div>
            </div>
            
            {saveStatus && (
              <div style={{
                color: "#15803d",
                background: "#e6ffec",
                padding: "8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                textAlign: "center",
                border: "1px solid #abf2af",
              }}>
                {saveStatus}
              </div>
            )}
            {error && (
              <div style={{
                color: "#b91c1c",
                background: "#ffebe9",
                padding: "8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                textAlign: "center",
                border: "1px solid #ffc1c1",
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Right panel: Preview viewport simulator */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--paper-warm)",
            padding: "16px",
            boxSizing: "border-box",
            height: "700px",
          }}>
            {/* Viewport size controls */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              background: "var(--paper-card)",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink)" }}>
                Live Responsive Preview
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setViewportMode("desktop")}
                  style={{
                    background: viewportMode === "desktop" ? "var(--accent)" : "transparent",
                    color: viewportMode === "desktop" ? "white" : "var(--ink-muted)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🖥️ Desktop
                </button>
                <button
                  onClick={() => setViewportMode("mobile")}
                  style={{
                    background: viewportMode === "mobile" ? "var(--accent)" : "transparent",
                    color: viewportMode === "mobile" ? "white" : "var(--ink-muted)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  📱 Mobile
                </button>
              </div>
            </div>

            {/* Simulating the device border */}
            <div style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                width: viewportMode === "mobile" ? "375px" : "100%",
                maxWidth: "100%",
                border: viewportMode === "mobile" ? "8px solid #1c1917" : "1px solid var(--border)",
                borderRadius: viewportMode === "mobile" ? "24px" : "8px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                background: "white",
                transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                overflow: "hidden",
              }}>
                <iframe
                  title="Portfolio Live Preview"
                  srcDoc={iframeSrcDoc}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "white",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Panel Container ───────────────────────────

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "10px",
      overflow: "hidden",
      background: "var(--paper)",
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--accent-bg)",
          border: "none",
          borderBottom: isOpen ? "1px solid var(--border)" : "none",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>
          {title}
        </span>
        <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "12px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Shared Input Style ─────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--paper-card)",
  color: "var(--ink)",
  fontSize: "12px",
  outline: "none",
  marginTop: "4px",
  fontFamily: "inherit",
};
