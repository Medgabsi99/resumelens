"use client";

import { useState } from "react";
import {
  Zap,
  Eye,
  MessageSquare,
  Globe,
  Mic,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  score?: number;
  hasResume?: boolean;
  onOpenBragStudio?: () => void;
}

export default function GlassmorphismHud({ score, hasResume = true, onOpenBragStudio }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!hasResume) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9000,
        pointerEvents: "auto",
      }}
      className="print:hidden"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          background: "rgba(15, 23, 42, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1.5px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "99px",
          padding: isCollapsed ? "6px 14px" : "8px 18px",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.45), 0 0 30px rgba(139, 92, 246, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* HUD Score Badge */}
        {score !== undefined && (
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "99px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
            }}
          >
            <Sparkles size={13} style={{ color: "#a78bfa" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171",
                fontFamily: "DM Mono, monospace",
              }}
            >
              {score}%
            </span>
          </div>
        )}

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}
            >
              {/* Quick Jump Buttons */}
              {onOpenBragStudio && (
                <button
                  onClick={onOpenBragStudio}
                  title="Brag Studio: LinkedIn Shareable Cards"
                  style={{
                    ...hudButtonStyle,
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(16, 185, 129, 0.25))",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                  }}
                >
                  <Award size={14} style={{ color: "#a78bfa" }} />
                  <span style={{ fontWeight: 700 }}>Brag Studio 🚀</span>
                </button>
              )}

              <button
                onClick={() => scrollToSection("score-breakdown")}
                title="ATS Breakdown"
                style={hudButtonStyle}
              >
                <BarChart2 size={14} style={{ color: "#8b5cf6" }} />
                <span>Metrics</span>
              </button>

              <button
                onClick={() => scrollToSection("heatmap-section")}
                title="Recruiter Heatmap"
                style={hudButtonStyle}
              >
                <Eye size={14} style={{ color: "#ef4444" }} />
                <span>Heatmap</span>
              </button>

              <button
                onClick={() => scrollToSection("rewrites-section")}
                title="One-Click Bullet Rewrites"
                style={hudButtonStyle}
              >
                <Zap size={14} style={{ color: "#f59e0b" }} />
                <span>Rewrites</span>
              </button>

              <button
                onClick={() => scrollToSection("interview-prep-section")}
                title="AI Mock Interview Prep"
                style={hudButtonStyle}
              >
                <Mic size={14} style={{ color: "#10b981" }} />
                <span>Interview</span>
              </button>

              <button
                onClick={() => scrollToSection("portfolio-section")}
                title="Personal Portfolio Generator"
                style={hudButtonStyle}
              >
                <Globe size={14} style={{ color: "#06b6d4" }} />
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => scrollToSection("chat-section")}
                title="Chat with your Resume"
                style={hudButtonStyle}
              >
                <MessageSquare size={14} style={{ color: "#ec4899" }} />
                <span>AI Chat</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand / Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px",
          }}
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </motion.div>
    </div>
  );
}

const hudButtonStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "99px",
  padding: "5px 12px",
  color: "#f8fafc",
  fontSize: "11.5px",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
  transition: "all 0.15s ease",
};
