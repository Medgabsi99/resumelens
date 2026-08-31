/**
 * multiLlmFallback.ts
 *
 * Enterprise Circuit Breaker & Multi-LLM Self-Healing Resilience Engine.
 * Fallback Chain: Google Gemini 3.5 Flash ➔ Claude 3.5 Haiku ➔ GPT-4o-mini ➔ Deterministic Heuristics
 */

export type LlmProvider =
  "gemini-3.6-flash" | "claude-3.5-haiku" | "gpt-4o-mini" | "deterministic-fallback";

export interface LlmExecutionResult<T> {
  data: T;
  providerUsed: LlmProvider;
  latencyMs: number;
  attempts: number;
  fellBack: boolean;
}

export interface FallbackOptions {
  timeoutMs?: number;
  maxAttempts?: number;
}

/**
 * Wraps any AI execution in a resilient multi-provider fallback circuit breaker.
 */
export async function executeWithMultiLlmFallback<T>(
  primaryFn: () => Promise<T>,
  secondaryFn?: () => Promise<T>,
  tertiaryFn?: () => Promise<T>,
  deterministicFallback?: () => T,
  options: FallbackOptions = {}
): Promise<LlmExecutionResult<T>> {
  const timeoutMs = options.timeoutMs || 1800;
  const startTime = Date.now();
  let attempts = 0;

  // Helper with race timeout
  const runWithTimeout = async (fn: () => Promise<T>): Promise<T> => {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("LLM Request Timeout")), timeoutMs)
      ),
    ]);
  };

  // 1. Try Primary: Gemini 3.5 Flash
  try {
    attempts++;
    const result = await runWithTimeout(primaryFn);
    return {
      data: result,
      providerUsed: "gemini-3.6-flash",
      latencyMs: Date.now() - startTime,
      attempts,
      fellBack: false,
    };
  } catch (primaryErr) {
    console.warn(
      "[Multi-LLM Circuit Breaker] Primary provider failed, tripping secondary...",
      primaryErr
    );
  }

  // 2. Try Secondary: Claude 3.5 Haiku
  if (secondaryFn) {
    try {
      attempts++;
      const result = await runWithTimeout(secondaryFn);
      return {
        data: result,
        providerUsed: "claude-3.5-haiku",
        latencyMs: Date.now() - startTime,
        attempts,
        fellBack: true,
      };
    } catch (secondaryErr) {
      console.warn(
        "[Multi-LLM Circuit Breaker] Secondary provider failed, tripping tertiary...",
        secondaryErr
      );
    }
  }

  // 3. Try Tertiary: GPT-4o-mini
  if (tertiaryFn) {
    try {
      attempts++;
      const result = await runWithTimeout(tertiaryFn);
      return {
        data: result,
        providerUsed: "gpt-4o-mini",
        latencyMs: Date.now() - startTime,
        attempts,
        fellBack: true,
      };
    } catch (tertiaryErr) {
      console.warn(
        "[Multi-LLM Circuit Breaker] Tertiary provider failed, using deterministic heuristics...",
        tertiaryErr
      );
    }
  }

  // 4. Safe Deterministic Local Heuristics
  attempts++;
  const fallbackData = deterministicFallback ? deterministicFallback() : ({} as T);
  return {
    data: fallbackData,
    providerUsed: "deterministic-fallback",
    latencyMs: Date.now() - startTime,
    attempts,
    fellBack: true,
  };
}
