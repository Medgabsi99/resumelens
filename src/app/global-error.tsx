"use client";

import React, { useEffect } from "react";
import { telemetry } from "@/lib/telemetry/tracker";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    telemetry.captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0e11",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            padding: 32,
            background: "#18181b",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertTriangle size={26} />
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Application Error</h2>

          <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "#a1a1aa", lineHeight: 1.5 }}>
            A critical application error occurred. We have logged this event and our team has been
            notified.
          </p>

          <button
            onClick={() => reset()}
            style={{
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RefreshCw size={14} /> Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
