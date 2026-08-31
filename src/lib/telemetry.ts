/**
 * AI Telemetry Module
 *
 * Provides structured, zero-dependency latency and error tracking for all
 * Gemini AI calls. Integrates transparently with the existing logger.
 *
 * Architecture:
 *  - `trackAICall(route, model, fn)` — wraps any async AI call, measures
 *    wall-clock duration, logs a structured telemetry event, and updates
 *    the in-memory MetricsRegistry.
 *  - `MetricsRegistry` — rolling window (last 1000 calls per model) used to
 *    compute p50 / p95 latency and error rates on demand.
 *  - `getMetricsSummary()` — returns an aggregated snapshot suitable for
 *    serving from the admin metrics endpoint.
 *
 * Usage (already wired into withRetryAndTimeout in client.ts):
 *   const result = await trackAICall("analyze", "gemini-3.6-flash", () =>
 *     model.generateContent(prompt)
 *   );
 */

import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TelemetryEvent {
  event: "ai_call_complete" | "ai_call_error";
  route: string;
  model: string;
  duration_ms: number;
  success: boolean;
  attempt: number;
  timestamp: string;
  error_message?: string;
}

export interface ModelMetrics {
  model: string;
  count: number;
  error_count: number;
  error_rate: number;
  p50_ms: number;
  p95_ms: number;
  min_ms: number;
  max_ms: number;
  avg_ms: number;
}

// ─── MetricsRegistry ──────────────────────────────────────────────────────────

const WINDOW_SIZE = 1000; // Rolling window: retain last N calls per model

/**
 * In-memory rolling window metrics accumulator.
 * Stores raw durations (ms) per model — percentiles are computed on read.
 * Thread-safe within a single Node.js event loop (no shared state across workers).
 */
class MetricsRegistry {
  /** Map of model name → array of { duration_ms, success } entries */
  private readonly store = new Map<string, Array<{ duration_ms: number; success: boolean }>>();

  record(model: string, duration_ms: number, success: boolean): void {
    if (!this.store.has(model)) {
      this.store.set(model, []);
    }
    const bucket = this.store.get(model)!;
    bucket.push({ duration_ms, success });
    // Trim to rolling window
    if (bucket.length > WINDOW_SIZE) {
      bucket.splice(0, bucket.length - WINDOW_SIZE);
    }
  }

  getSummary(): ModelMetrics[] {
    const result: ModelMetrics[] = [];

    for (const [model, entries] of this.store.entries()) {
      if (entries.length === 0) continue;

      const durations = entries.map((e) => e.duration_ms).sort((a, b) => a - b);
      const errorCount = entries.filter((e) => !e.success).length;
      const count = entries.length;

      result.push({
        model,
        count,
        error_count: errorCount,
        error_rate: Number((errorCount / count).toFixed(4)),
        p50_ms: percentile(durations, 50),
        p95_ms: percentile(durations, 95),
        min_ms: durations[0],
        max_ms: durations[durations.length - 1],
        avg_ms: Math.round(durations.reduce((a, b) => a + b, 0) / count),
      });
    }

    // Sort by total call count descending (most-used models first)
    return result.sort((a, b) => b.count - a.count);
  }

  reset(): void {
    this.store.clear();
  }
}

/** Singleton registry — module-level, survives between requests in same process */
export const metricsRegistry = new MetricsRegistry();

// ─── Core Tracking Function ───────────────────────────────────────────────────

/**
 * Wraps an async AI call with structured telemetry tracking.
 *
 * @param route   - The API route name (e.g. "analyze", "chat")
 * @param model   - The model identifier (e.g. "gemini-3.6-flash")
 * @param fn      - The async AI call to execute
 * @param attempt - Retry attempt number (default: 1)
 * @returns The result of `fn()`
 * @throws Re-throws any error from `fn()` after recording the failure metric
 */
export async function trackAICall<T>(
  route: string,
  model: string,
  fn: () => Promise<T>,
  attempt = 1
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration_ms = Math.round(performance.now() - start);

    const event: TelemetryEvent = {
      event: "ai_call_complete",
      route,
      model,
      duration_ms,
      success: true,
      attempt,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[telemetry] AI call succeeded`, event);
    metricsRegistry.record(model, duration_ms, true);

    return result;
  } catch (error: unknown) {
    const duration_ms = Math.round(performance.now() - start);
    const error_message = error instanceof Error ? error.message : String(error);

    const event: TelemetryEvent = {
      event: "ai_call_error",
      route,
      model,
      duration_ms,
      success: false,
      attempt,
      timestamp: new Date().toISOString(),
      error_message,
    };

    logger.warn(`[telemetry] AI call failed`, event);
    metricsRegistry.record(model, duration_ms, false);

    throw error;
  }
}

/**
 * Returns an aggregated snapshot of all tracked AI calls.
 * Suitable for serving from an admin metrics endpoint.
 */
export function getMetricsSummary(): ModelMetrics[] {
  return metricsRegistry.getSummary();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes the Nth percentile of a pre-sorted array of numbers.
 * Uses the nearest-rank method.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}
