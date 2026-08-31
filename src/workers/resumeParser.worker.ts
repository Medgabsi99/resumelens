/**
 * resumeParser.worker.ts
 *
 * Dedicated Web Worker for offloading CPU-intensive text parsing,
 * LCS word diffing, and deterministic ATS scanning from the main thread.
 */

import { parseResume } from "@/lib/parseResume";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import { calculateHeatmapData } from "@/lib/heatmapEngine";

export interface DiffToken {
  type: "equal" | "insert" | "delete";
  text: string;
}

// Myers LCS Word Diff Algorithm
export function computeWordDiff(a: string, b: string): DiffToken[] {
  const wordsA = a.match(/\S+|\s+/g) ?? [];
  const wordsB = b.match(/\S+|\s+/g) ?? [];

  const m = wordsA.length;
  const n = wordsB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (wordsA[i] === wordsB[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && wordsA[i] === wordsB[j]) {
      tokens.push({ type: "equal", text: wordsA[i] });
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      tokens.push({ type: "insert", text: wordsB[j] });
      j++;
    } else {
      tokens.push({ type: "delete", text: wordsA[i] });
      i++;
    }
  }

  // Merge adjacent same-type tokens for compact payload
  return tokens.reduce<DiffToken[]>((acc, token) => {
    const last = acc[acc.length - 1];
    if (last && last.type === token.type) {
      last.text += token.text;
      return acc;
    }
    return [...acc, { ...token }];
  }, []);
}

// Worker message router
if (typeof self !== "undefined") {
  self.onmessage = (e: MessageEvent) => {
    const { id, type, payload } = e.data;

    try {
      let result;
      switch (type) {
        case "PARSE_RESUME":
          result = parseResume(payload.text);
          break;

        case "COMPUTE_DIFF":
          result = computeWordDiff(payload.original, payload.updated);
          break;

        case "RUN_ATS_CHECKS":
          result = runAtsChecks(payload.text, payload.targetRole);
          break;

        case "CALCULATE_HEATMAP":
          result = calculateHeatmapData(payload.text);
          break;

        default:
          throw new Error(`Unknown worker message type: ${type}`);
      }

      self.postMessage({ id, success: true, result });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Worker processing error";
      self.postMessage({ id, success: false, error: errorMessage });
    }
  };
}
