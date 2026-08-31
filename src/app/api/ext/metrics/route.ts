/**
 * GET /api/ext/metrics
 *
 * Admin-only endpoint that returns a live snapshot of AI call performance
 * metrics from the in-memory MetricsRegistry.
 *
 * Response shape:
 * {
 *   success: true,
 *   data: ModelMetrics[],
 *   generated_at: string (ISO 8601)
 * }
 *
 * Access: requires authenticated user with role = 'admin'.
 * Returns 403 for all other authenticated users.
 * Returns 401 for unauthenticated requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUser, getUserProfile } from "@/lib/auth";
import { getMetricsSummary } from "@/lib/telemetry";

export const dynamic = "force-dynamic"; // Never cache this endpoint

export async function GET(_req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Admin-only guard ───────────────────────────────────
  const profile = await getUserProfile(user.id);
  if (!profile || (profile as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden: admin access required" },
      { status: 403 }
    );
  }

  // ── 3. Return metrics snapshot ────────────────────────────
  const summary = getMetricsSummary();

  return NextResponse.json({
    success: true,
    data: summary,
    generated_at: new Date().toISOString(),
    note:
      "Metrics are in-memory and reset on server restart. " +
      `Currently tracking ${summary.reduce((acc, m) => acc + m.count, 0)} total AI calls.`,
  });
}
