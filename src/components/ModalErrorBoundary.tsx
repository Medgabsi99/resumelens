"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import logger from "@/lib/logger";

interface Props {
  children: ReactNode;
  modalTitle?: string;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Modal Rendering Error Boundary Caught Error:", { error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--paper-card)] border border-[var(--border)] shadow-2xl p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle size={20} />
                <h4 className="text-sm font-bold">
                  {this.props.modalTitle || "Modal Container Error"}
                </h4>
              </div>
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-warm)] rounded-lg transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--ink)]">
                Something went wrong displaying this dialog window.
              </p>
              {this.state.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-[11px] text-red-700 dark:text-red-300 overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
              <p className="text-[11px] text-[var(--ink-muted)]">
                Your parent workspace and data remain safe. You can retry rendering or close this
                window.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)] text-xs font-medium">
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--paper-warm)] text-[var(--ink)]"
                >
                  Close Window
                </button>
              )}
              <button
                onClick={this.handleReset}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModalErrorBoundary;
