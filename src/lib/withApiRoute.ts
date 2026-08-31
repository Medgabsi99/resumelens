/**
 * withApiRoute — Composable API Route Middleware HOF
 *
 * Wraps Next.js App Router route handlers with a standard lifecycle:
 *   1. Authentication  → 401 Unauthorized
 *   2. Rate limiting   → 429 Too Many Requests
 *   3. Quota check     → 403 Forbidden (when requiresQuota: true)
 *   4. Unhandled errors → 500 Internal Server Error
 *
 * @example
 * export const POST = withApiRoute(
 *   async (req, { user, profile }) => {
 *     const body = await req.json();
 *     // ... pure business logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { routeName: "my-route", requiresQuota: true }
 * );
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUser, getUserProfile, canAnalyze } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteContext {
  /** The authenticated Supabase user. Always present when requiresAuth is true. */
  user: User;
  /**
   * The user's profile row. Present when requiresQuota is true, or when
   * requiresAuth is true and profile lookup succeeded.
   */
  profile: Awaited<ReturnType<typeof getUserProfile>>;
}

export interface ApiRouteOptions {
  /** Key used for per-user rate limiting (e.g. "analyze", "chat"). */
  routeName: string;
  /**
   * When true, fetches the user profile and checks canAnalyze().
   * Returns 403 if the user is on the free tier and quota is exceeded.
   * @default false
   */
  requiresQuota?: boolean;
  /**
   * When false, skips auth entirely. Use only for public endpoints.
   * @default true
   */
  requiresAuth?: boolean;
}

type AuthenticatedHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>;

type UnauthenticatedHandler = (
  req: NextRequest,
  ctx: Partial<RouteContext>
) => Promise<NextResponse>;

// ─── HOF ──────────────────────────────────────────────────────────────────────

/**
 * Wraps an authenticated route handler with the standard lifecycle middleware.
 */
export function withApiRoute(
  handler: AuthenticatedHandler,
  options: ApiRouteOptions & { requiresAuth?: true }
): (req: NextRequest) => Promise<NextResponse>;

/**
 * Wraps an unauthenticated route handler (public endpoint).
 */
export function withApiRoute(
  handler: UnauthenticatedHandler,
  options: ApiRouteOptions & { requiresAuth: false }
): (req: NextRequest) => Promise<NextResponse>;

export function withApiRoute(
  handler: AuthenticatedHandler | UnauthenticatedHandler,
  options: ApiRouteOptions
): (req: NextRequest) => Promise<NextResponse> {
  const { routeName, requiresQuota = false, requiresAuth = true } = options;

  return async function wrappedHandler(req: NextRequest): Promise<NextResponse> {
    // ── 1. Authentication ──────────────────────────────────────────────────
    if (!requiresAuth) {
      try {
        return await (handler as UnauthenticatedHandler)(req, {});
      } catch (err: unknown) {
        logger.error(`[${routeName}] Unhandled error in public route:`, err);
        return NextResponse.json(
          { success: false, error: "Internal server error" },
          { status: 500 }
        );
      }
    }

    let user: User;
    try {
      user = await requireUser();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Rate limiting ───────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(user.id, routeName);
    if (!rateLimit.success) {
      return rateLimitResponse();
    }

    // ── 3. Quota check (optional) ──────────────────────────────────────────
    let profile: Awaited<ReturnType<typeof getUserProfile>> = null;
    if (requiresQuota) {
      profile = await getUserProfile(user.id);
      if (!profile || !canAnalyze(profile)) {
        return NextResponse.json(
          {
            success: false,
            error: `Upgrade required to use ${routeName}`,
          },
          { status: 403 }
        );
      }
    }

    // ── 4. Invoke handler with error boundary ──────────────────────────────
    try {
      return await (handler as AuthenticatedHandler)(req, { user, profile });
    } catch (err: unknown) {
      logger.error(`[${routeName}] Unhandled error:`, err);
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  };
}
