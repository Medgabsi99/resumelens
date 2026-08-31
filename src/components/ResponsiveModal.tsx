"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string | number;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 680,
}: Props) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            width: "100%",
            maxWidth,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
            overflow: "hidden",
          }}
          className="sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="flex sm:hidden justify-center pt-3 pb-1">
            <div
              style={{
                width: 38,
                height: 4.5,
                borderRadius: 3,
                background: "var(--border-strong)",
                opacity: 0.8,
              }}
            />
          </div>

          {/* Modal Header */}
          {title && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--paper-warm)",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--ink)",
                  fontFamily: "DM Serif Display, serif",
                }}
              >
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                }}
                className="hover:text-ink transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div
            style={{
              padding: "20px",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
