"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { telemetry } from "@/lib/telemetry/tracker";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class TelemetryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    telemetry.captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            maxWidth: 500,
            margin: "20px auto",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={22} />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            {this.props.fallbackTitle || "Something went wrong in this section"}
          </h3>

          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
            A client-side error occurred. We have logged the error details to our telemetry system.
          </p>

          <button
            onClick={this.handleReset}
            style={{
              marginTop: 6,
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
