"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Award,
  Flame,
  Palette,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface Props {
  score: number;
  targetRole?: string;
  candidateName?: string;
  keywordsMatched?: number;
  onClose: () => void;
}

export type BragTheme = "cyberpunk" | "gold" | "jade" | "minimal";

interface ThemePreset {
  id: BragTheme;
  label: string;
  bgGrad: [string, string];
  accentColor: string;
  cardBg: string;
  border: string;
  textColor: string;
  subColor: string;
  badgeBg: string;
}

const THEMES: Record<BragTheme, ThemePreset> = {
  cyberpunk: {
    id: "cyberpunk",
    label: "Cyberpunk Obsidian",
    bgGrad: ["#090d16", "#1e1b4b"],
    accentColor: "#8b5cf6",
    cardBg: "rgba(30, 27, 75, 0.45)",
    border: "rgba(139, 92, 246, 0.35)",
    textColor: "#ffffff",
    subColor: "#a78bfa",
    badgeBg: "rgba(139, 92, 246, 0.2)",
  },
  gold: {
    id: "gold",
    label: "Ember Gold",
    bgGrad: ["#170f03", "#451a03"],
    accentColor: "#f59e0b",
    cardBg: "rgba(69, 26, 3, 0.45)",
    border: "rgba(245, 158, 11, 0.35)",
    textColor: "#ffffff",
    subColor: "#fbbf24",
    badgeBg: "rgba(245, 158, 11, 0.2)",
  },
  jade: {
    id: "jade",
    label: "Jade Mint",
    bgGrad: ["#041e17", "#064e3b"],
    accentColor: "#10b981",
    cardBg: "rgba(6, 78, 59, 0.45)",
    border: "rgba(16, 185, 129, 0.35)",
    textColor: "#ffffff",
    subColor: "#34d399",
    badgeBg: "rgba(16, 185, 129, 0.2)",
  },
  minimal: {
    id: "minimal",
    label: "Minimal Crisp",
    bgGrad: ["#f1f5f9", "#e2e8f0"],
    accentColor: "#0f172a",
    cardBg: "#ffffff",
    border: "#94a3b8",
    textColor: "#0f172a",
    subColor: "#64748b",
    badgeBg: "#cbd5e1",
  },
};

export default function BragStudioModal({
  score,
  targetRole = "Software Engineer",
  candidateName = "Candidate",
  keywordsMatched = 12,
  onClose,
}: Props) {
  const [selectedTheme, setSelectedTheme] = useState<BragTheme>("cyberpunk");
  const [customHeadline, setCustomHeadline] = useState(
    `🚀 Just optimized my resume to a ${score}% ATS Match Score for ${targetRole} roles!`
  );
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { success: toastSuccess } = useToast();

  const theme = THEMES[selectedTheme];

  // ── Render 1200x630 High-Res Canvas ────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, theme.bgGrad[0]);
    bgGrad.addColorStop(1, theme.bgGrad[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Radial Spotlights
    const rad1 = ctx.createRadialGradient(250, 150, 10, 250, 150, 450);
    rad1.addColorStop(0, theme.accentColor + "33");
    rad1.addColorStop(1, "transparent");
    ctx.fillStyle = rad1;
    ctx.fillRect(0, 0, width, height);

    const rad2 = ctx.createRadialGradient(950, 480, 10, 950, 480, 500);
    rad2.addColorStop(0, theme.accentColor + "22");
    rad2.addColorStop(1, "transparent");
    ctx.fillStyle = rad2;
    ctx.fillRect(0, 0, width, height);

    // 3. Central Glassmorphism Card Frame
    const padding = 50;
    const cardX = padding;
    const cardY = padding;
    const cardW = width - padding * 2;
    const cardH = height - padding * 2;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 24);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeRect(cardX, cardY, cardW, cardH);
    }

    // 4. Header Bar: Brand Logo & Verified Badge
    ctx.fillStyle = theme.subColor;
    ctx.font = "bold 20px monospace";
    ctx.fillText("RESUMELENS VERIFIED • 2026", cardX + 45, cardY + 65);

    // 5. Candidate Name & Role Title
    ctx.fillStyle = theme.textColor;
    ctx.font = "800 44px sans-serif";
    ctx.fillText(candidateName, cardX + 45, cardY + 130);

    ctx.fillStyle = theme.subColor;
    ctx.font = "600 26px sans-serif";
    ctx.fillText(`Target Role: ${targetRole}`, cardX + 45, cardY + 175);

    // 6. Large Score Callout Circle / Badge
    const scoreX = cardX + cardW - 220;
    const scoreY = cardY + 180;
    const scoreR = 100;

    // Score Circle Background
    ctx.beginPath();
    ctx.arc(scoreX, scoreY, scoreR, 0, Math.PI * 2);
    ctx.fillStyle = theme.badgeBg;
    ctx.fill();
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Score Number
    ctx.fillStyle = theme.textColor;
    ctx.font = "800 68px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${score}%`, scoreX, scoreY - 10);

    ctx.fillStyle = theme.subColor;
    ctx.font = "700 16px sans-serif";
    ctx.fillText("ATS MATCH SCORE", scoreX, scoreY + 45);

    // Reset Text Align
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 7. Achievement Pill Badges
    const pills = [
      `🎯 ${score >= 80 ? "Top 5% Candidate Fit" : "High ATS Alignment"}`,
      `🔑 ${keywordsMatched}+ Key Industry Keywords`,
      `⚡ 6-Sec Recruiter Scannable`,
    ];

    let pillX = cardX + 45;
    const pillY = cardY + 280;

    pills.forEach((pillText) => {
      ctx.font = "bold 18px sans-serif";
      const metrics = ctx.measureText(pillText);
      const pw = metrics.width + 32;
      const ph = 44;

      ctx.fillStyle = theme.badgeBg;
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1.5;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pw, ph, 12);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(pillX, pillY, pw, ph);
      }

      ctx.fillStyle = theme.textColor;
      ctx.fillText(pillText, pillX + 16, pillY + 28);

      pillX += pw + 16;
    });

    // 8. Custom Caption / Summary Box
    ctx.fillStyle = theme.subColor;
    ctx.font = "italic 22px sans-serif";
    const shortHeadline =
      customHeadline.length > 70 ? customHeadline.slice(0, 67) + "..." : customHeadline;
    ctx.fillText(`"${shortHeadline}"`, cardX + 45, cardY + 390);

    // 9. Footer Callout
    ctx.fillStyle = theme.subColor;
    ctx.font = "600 18px monospace";
    ctx.fillText("Built & Verified with ResumeLens AI Platform", cardX + 45, cardY + cardH - 45);
  }, [theme, score, targetRole, candidateName, keywordsMatched, customHeadline]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // ── Download PNG File ──────────────────────────────────────
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `ResumeLens-Achievement-${score}pts.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toastSuccess("Achievement Card downloaded!", "PNG Saved");
  };

  // ── Copy Caption Text ──────────────────────────────────────
  const handleCopyCaption = () => {
    const postText = `${customHeadline}\n\nKey Highlights:\n• ATS Score: ${score}/100\n• Target Role: ${targetRole}\n• Verified with ResumeLens AI\n\n#CareerGrowth #ResumeOptimization #JobSearch #ResumeLens`;
    navigator.clipboard.writeText(postText);
    setCopied(true);
    toastSuccess("LinkedIn caption copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Share Directly on LinkedIn ─────────────────────────────
  const handleShareLinkedIn = () => {
    handleCopyCaption();
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      "https://resumelens.ai"
    )}`;
    window.open(linkedinUrl, "_blank", "width=600,height=600");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 12, 0.90)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      className="print:hidden"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "840px",
          background: "var(--paper-card)",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Modal Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8b5cf6",
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                LinkedIn Achievement Brag Studio
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--ink-muted)" }}>
                Export high-resolution 1200x630 shareable graphics for LinkedIn & Twitter/X.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--ink-muted)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme Selector Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: "var(--ink-muted)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            Theme Style:
          </span>
          {(Object.keys(THEMES) as BragTheme[]).map((tKey) => {
            const tItem = THEMES[tKey];
            const active = selectedTheme === tKey;
            return (
              <button
                key={tKey}
                onClick={() => setSelectedTheme(tKey)}
                style={{
                  background: active ? "var(--accent)" : "var(--paper)",
                  color: active ? "white" : "var(--ink-muted)",
                  border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tItem.label}
              </button>
            );
          })}
        </div>

        {/* High-Res 1200x630 Live Preview Canvas */}
        <div
          style={{
            background: "#090d16",
            borderRadius: "14px",
            padding: "12px",
            border: "1px solid var(--border)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "10px",
              maxHeight: "380px",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Editable Headline */}
        <div>
          <label
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: "var(--ink-muted)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Headline Caption
          </label>
          <input
            type="text"
            value={customHeadline}
            onChange={(e) => setCustomHeadline(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "12.5px",
              outline: "none",
            }}
          />
        </div>

        {/* Export & Sharing Action Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={handleCopyCaption}
            style={{
              background: "var(--paper-warm)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {copied ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
            {copied ? "Caption Copied!" : "Copy Post Caption"}
          </button>

          <button
            onClick={handleDownloadPNG}
            style={{
              background: "var(--paper)",
              border: "1.5px solid var(--accent)",
              color: "var(--accent)",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Download size={14} />
            Download PNG (1200x630)
          </button>

          <button
            onClick={handleShareLinkedIn}
            style={{
              background: "linear-gradient(135deg, #0a66c2, #004182)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 22px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(10, 102, 194, 0.35)",
            }}
          >
            <Share2 size={14} />
            Share to LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}
