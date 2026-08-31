"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ParsedResume } from "@/lib/parseResume";
import { parseResume } from "@/lib/parseResume";
import type { AtsRulesResult } from "@/lib/atsRulesChecker";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import type { HeatmapAnalysis } from "@/lib/heatmapEngine";
import { calculateHeatmapData } from "@/lib/heatmapEngine";
import { computeWordDiff, type DiffToken } from "@/workers/resumeParser.worker";

let workerInstance: Worker | null = null;
const pendingPromises = new Map<
  string,
  { resolve: (val: any) => void; reject: (err: any) => void }
>();

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL("../workers/resumeParser.worker.ts", import.meta.url));

      workerInstance.onmessage = (e: MessageEvent) => {
        const { id, success, result, error } = e.data;
        const pending = pendingPromises.get(id);
        if (pending) {
          pendingPromises.delete(id);
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
        }
      };

      workerInstance.onerror = (err) => {
        console.warn("[useWorkerParser] Web Worker error, falling back:", err);
      };
    } catch {
      workerInstance = null;
    }
  }

  return workerInstance;
}

function dispatchWorkerTask<T>(type: string, payload: any): Promise<T> {
  const worker = getWorker();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Fallback to local main-thread execution if worker is unavailable
  if (!worker) {
    return new Promise<T>((resolve, reject) => {
      try {
        switch (type) {
          case "PARSE_RESUME":
            resolve(parseResume(payload.text) as unknown as T);
            break;
          case "COMPUTE_DIFF":
            resolve(computeWordDiff(payload.original, payload.updated) as unknown as T);
            break;
          case "RUN_ATS_CHECKS":
            resolve(runAtsChecks(payload.text, payload.targetRole) as unknown as T);
            break;
          case "CALCULATE_HEATMAP":
            resolve(calculateHeatmapData(payload.text) as unknown as T);
            break;
          default:
            reject(new Error(`Unknown task type ${type}`));
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  return new Promise<T>((resolve, reject) => {
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({ id, type, payload });
  });
}

/**
 * Universal async parsing and diffing helpers offloaded to Web Worker
 */
export async function parseResumeAsync(text: string): Promise<ParsedResume> {
  return dispatchWorkerTask<ParsedResume>("PARSE_RESUME", { text });
}

export async function computeDiffAsync(original: string, updated: string): Promise<DiffToken[]> {
  return dispatchWorkerTask<DiffToken[]>("COMPUTE_DIFF", { original, updated });
}

export async function runAtsChecksAsync(
  text: string,
  targetRole?: string
): Promise<AtsRulesResult> {
  return dispatchWorkerTask<AtsRulesResult>("RUN_ATS_CHECKS", { text, targetRole });
}

export async function calculateHeatmapAsync(text: string): Promise<HeatmapAnalysis> {
  return dispatchWorkerTask<HeatmapAnalysis>("CALCULATE_HEATMAP", { text });
}

export function useWorkerParser() {
  return {
    parseResumeAsync,
    computeDiffAsync,
    runAtsChecksAsync,
    calculateHeatmapAsync,
  };
}
