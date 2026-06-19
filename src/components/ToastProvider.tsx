"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────
export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration: number; // ms, 0 = persist until closed
  action?: { label: string; onClick: () => void };
  /** internal – set to true when animating out */
  removing?: boolean;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id" | "removing">) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Context ──────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Variant config ───────────────────────────────────────────
const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: string; accent: string; bg: string; border: string; progress: string }
> = {
  success: {
    icon: "✓",
    accent: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.25)",
    progress: "#10b981",
  },
  error: {
    icon: "✕",
    accent: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    progress: "#ef4444",
  },
  warning: {
    icon: "⚠",
    accent: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    progress: "#f59e0b",
  },
  info: {
    icon: "ℹ",
    accent: "#6366f1",
    bg: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.25)",
    progress: "#6366f1",
  },
};

// ─── Single Toast Item Component ──────────────────────────────
function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const cfg = VARIANT_CONFIG[toast.variant];
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="alert"
      aria-live="assertive"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 14px 16px",
        background: "var(--paper-card)",
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.accent}`,
        borderRadius: 12,
        boxShadow: `0 8px 32px -8px rgba(0,0,0,0.35), 0 0 0 1px ${cfg.border}`,
        minWidth: 280,
        maxWidth: 380,
        fontFamily: "Instrument Sans, system-ui, sans-serif",
        animation: toast.removing
          ? "toastOut 0.22s cubic-bezier(0.4,0,1,1) forwards"
          : "toastIn 0.28s cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: cfg.accent,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.3,
              marginBottom: 2,
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-muted)",
            lineHeight: 1.45,
          }}
        >
          {toast.message}
        </div>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onDismiss(toast.id);
            }}
            style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: 600,
              color: cfg.accent,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            {toast.action.label} →
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--ink-faint)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: "0 2px",
          flexShrink: 0,
          marginTop: 1,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--ink-faint)")
        }
      >
        ✕
      </button>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div
          ref={progressRef}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: cfg.progress,
            transformOrigin: "left",
            borderRadius: "0 0 12px 12px",
            animation: `toastProgress ${toast.duration}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────
export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Mark as removing first for exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 240);
    if (timers.current.has(id)) {
      clearTimeout(timers.current.get(id)!);
      timers.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, removing: true })));
    setTimeout(() => setToasts([]), 240);
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  const toast = useCallback(
    (opts: Omit<ToastItem, "id" | "removing">): string => {
      const id = Math.random().toString(36).slice(2);
      const item: ToastItem = { ...opts, id };

      setToasts((prev) => {
        // Max 5 stacked
        const next = [...prev, item];
        return next.length > 5 ? next.slice(next.length - 5) : next;
      });

      if (opts.duration > 0) {
        const timer = setTimeout(() => dismiss(id), opts.duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  // Convenience wrappers
  const success = useCallback(
    (message: string, title?: string) =>
      toast({ variant: "success", message, title, duration: 4000 }),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) =>
      toast({ variant: "error", message, title, duration: 6000 }),
    [toast]
  );
  const warning = useCallback(
    (message: string, title?: string) =>
      toast({ variant: "warning", message, title, duration: 5000 }),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) =>
      toast({ variant: "info", message, title, duration: 4000 }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{ toast, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}

      {/* Global keyframe styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0)    scale(1);    max-height: 120px; }
          to   { opacity: 0; transform: translateX(28px) scale(0.94); max-height: 0; margin-bottom: 0; padding: 0; }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}} />

      {/* Portal — fixed bottom-right stack */}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
