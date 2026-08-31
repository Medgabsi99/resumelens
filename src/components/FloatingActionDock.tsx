"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Zap, Search, ArrowUp, Sparkles, Check } from "lucide-react";

interface Props {
  score?: number;
  onDownloadPdf?: () => void;
  onOpenAutoFix?: () => void;
  onOpenCommandPalette?: () => void;
  isDownloading?: boolean;
}

export default function FloatingActionDock({
  score = 74,
  onDownloadPdf,
  onOpenAutoFix,
  onOpenCommandPalette,
  isDownloading = false,
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 45,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(249, 115, 22, 0.2)",
            color: "white",
          }}
          className="print:hidden select-none"
        >
          {/* Mini Score Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: scoreColor,
                boxShadow: `0 0 8px ${scoreColor}`,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                fontWeight: 800,
                color: "#f8fafc",
              }}
            >
              ATS: {score}
            </span>
          </div>

          <div style={{ width: 1, height: 18, background: "rgba(255, 255, 255, 0.15)" }} />

          {/* Quick Auto-Fix Button */}
          {onOpenAutoFix && (
            <button
              onClick={onOpenAutoFix}
              style={{
                background: "rgba(249, 115, 22, 0.2)",
                color: "#fb923c",
                border: "1px solid rgba(249, 115, 22, 0.4)",
                borderRadius: 12,
                padding: "6px 12px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
              }}
              className="hover:bg-orange-500/30"
              title="Open Auto-Fix Polish"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Auto-Fix</span>
            </button>
          )}

          {/* Quick Download PDF Button */}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              disabled={isDownloading}
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "6px 14px",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: isDownloading ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <Download size={13} />
              <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
            </button>
          )}

          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 10,
                padding: "6px 8px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
              }}
              className="hover:bg-white/15 transition-colors hidden sm:inline-flex"
              title="Command Palette (Cmd+K)"
            >
              <Search size={13} />
              <kbd style={{ fontSize: 9, fontFamily: "DM Mono, monospace", opacity: 0.8 }}>⌘K</kbd>
            </button>
          )}

          {/* Scroll to Top */}
          <button
            onClick={scrollToTop}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#94a3b8",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 10,
              padding: "6px 8px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
            }}
            className="hover:bg-white/15 hover:text-white transition-colors"
            title="Scroll to Top"
          >
            <ArrowUp size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
