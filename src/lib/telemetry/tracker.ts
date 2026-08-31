/**
 * Production Telemetry & Client Error Tracking Tracker
 *
 * Lightweight error reporter and breadcrumb tracker that safely records
 * runtime exceptions, hydration mismatches, and AI gateway timeouts
 * without tracking PII or resume contents.
 */

export interface TelemetryBreadcrumb {
  timestamp: string;
  category: "ui" | "navigation" | "network" | "ai" | "pdf";
  message: string;
  data?: Record<string, unknown>;
}

export interface TelemetryErrorPayload {
  name: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  breadcrumbs: TelemetryBreadcrumb[];
  context?: Record<string, unknown>;
  timestamp: string;
}

class TelemetryTracker {
  private breadcrumbs: TelemetryBreadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 20;

  /**
   * Adds an event breadcrumb to the rolling in-memory buffer.
   */
  public addBreadcrumb(
    category: TelemetryBreadcrumb["category"],
    message: string,
    data?: Record<string, unknown>
  ): void {
    const entry: TelemetryBreadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    };

    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Returns a copy of the current breadcrumb ring buffer.
   */
  public getBreadcrumbs(): TelemetryBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clears the breadcrumb buffer.
   */
  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Normalizes an error and sends it asynchronously to the telemetry ingestion endpoint.
   */
  public captureException(
    error: unknown,
    context?: Record<string, unknown>
  ): TelemetryErrorPayload {
    const isError = error instanceof Error;
    const name = isError ? error.name : "UnknownError";
    const message = isError ? error.message : String(error);
    const stack = isError ? error.stack : undefined;

    const payload: TelemetryErrorPayload = {
      name,
      message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      breadcrumbs: this.getBreadcrumbs(),
      context,
      timestamp: new Date().toISOString(),
    };

    // Client-side beacon dispatch
    if (typeof window !== "undefined") {
      try {
        const body = JSON.stringify(payload);
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon("/api/telemetry", body);
        } else {
          fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Fail silently in telemetry dispatch
      }
    }

    return payload;
  }

  /**
   * Records AI gateway latency metrics for performance observability.
   */
  public captureAiLatency(operation: string, durationMs: number, success: boolean): void {
    this.addBreadcrumb(
      "ai",
      `AI ${operation} finished in ${durationMs}ms (${success ? "success" : "failed"})`,
      {
        operation,
        durationMs,
        success,
      }
    );
  }
}

export const telemetry = new TelemetryTracker();
