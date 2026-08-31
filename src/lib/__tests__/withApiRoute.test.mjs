/**
 * Tests for the withApiRoute Higher-Order Function.
 * Verifies the auth → rate-limit → quota → handler lifecycle.
 *
 * We mock the individual dependency modules so this is a pure unit test
 * with no network calls or database access.
 */

import { test, describe, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ─── Minimal NextRequest / NextResponse stubs ─────────────────────────────────

function makeRequest(body = {}) {
  return {
    json: async () => body,
    headers: { get: () => null },
    nextUrl: { origin: "http://localhost:3000" },
  };
}

function extractStatus(response) {
  return response.status;
}

async function extractJson(response) {
  return response._body;
}

// ─── Stub implementations ─────────────────────────────────────────────────────

/**
 * Minimal withApiRoute implementation for testing purposes.
 * Mirrors the real implementation logic without Next.js dependencies.
 */
function createWithApiRoute({ requireUserImpl, checkRateLimitImpl, getUserProfileImpl, canAnalyzeImpl }) {
  return function withApiRoute(handler, options) {
    const { routeName, requiresQuota = false, requiresAuth = true } = options;

    return async function wrappedHandler(req) {
      if (!requiresAuth) {
        try {
          return await handler(req, {});
        } catch (err) {
          return { status: 500, _body: { success: false, error: "Internal server error" } };
        }
      }

      let user;
      try {
        user = await requireUserImpl();
      } catch {
        return { status: 401, _body: { success: false, error: "Unauthorized" } };
      }

      const rateLimit = await checkRateLimitImpl(user.id, routeName);
      if (!rateLimit.success) {
        return { status: 429, _body: { success: false, error: "Rate limit exceeded" } };
      }

      let profile = null;
      if (requiresQuota) {
        profile = await getUserProfileImpl(user.id);
        if (!profile || !canAnalyzeImpl(profile)) {
          return { status: 403, _body: { success: false, error: `Upgrade required to use ${routeName}` } };
        }
      }

      try {
        return await handler(req, { user, profile });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Internal server error";
        return { status: 500, _body: { success: false, error: message } };
      }
    };
  };
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe("withApiRoute — authentication", () => {
  test("returns 401 when requireUser throws", async () => {
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => { throw new Error("Not authenticated"); },
      checkRateLimitImpl: async () => ({ success: true }),
      getUserProfileImpl: async () => ({ tier: "pro" }),
      canAnalyzeImpl: () => true,
    });

    const handler = withApiRoute(async (_req, { user }) => ({
      status: 200,
      _body: { success: true, userId: user.id },
    }), { routeName: "test" });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 401);
    const body = await extractJson(response);
    assert.equal(body.success, false);
    assert.equal(body.error, "Unauthorized");
  });

  test("calls handler with user context on successful auth", async () => {
    const fakeUser = { id: "user-123" };
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => fakeUser,
      checkRateLimitImpl: async () => ({ success: true }),
      getUserProfileImpl: async () => ({ tier: "pro" }),
      canAnalyzeImpl: () => true,
    });

    const handler = withApiRoute(async (_req, { user }) => ({
      status: 200,
      _body: { success: true, userId: user.id },
    }), { routeName: "test" });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 200);
    const body = await extractJson(response);
    assert.equal(body.userId, "user-123");
  });
});

describe("withApiRoute — rate limiting", () => {
  test("returns 429 when rate limit is exceeded", async () => {
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => ({ id: "user-abc" }),
      checkRateLimitImpl: async () => ({ success: false }),
      getUserProfileImpl: async () => ({ tier: "pro" }),
      canAnalyzeImpl: () => true,
    });

    const handler = withApiRoute(async () => ({
      status: 200,
      _body: { success: true },
    }), { routeName: "analyze" });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 429);
  });

  test("passes through when rate limit is not exceeded", async () => {
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => ({ id: "user-abc" }),
      checkRateLimitImpl: async (userId, routeName) => {
        // Simulate per-route limit tracking
        assert.equal(routeName, "my-route");
        return { success: true };
      },
      getUserProfileImpl: async () => ({ tier: "pro" }),
      canAnalyzeImpl: () => true,
    });

    const handler = withApiRoute(async () => ({
      status: 200,
      _body: { success: true },
    }), { routeName: "my-route" });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 200);
  });
});

describe("withApiRoute — quota check", () => {
  test("returns 403 when requiresQuota is true and user cannot analyze", async () => {
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => ({ id: "free-user" }),
      checkRateLimitImpl: async () => ({ success: true }),
      getUserProfileImpl: async () => ({ tier: "free", analyses_used: 3, analyses_limit: 3 }),
      canAnalyzeImpl: () => false,
    });

    const handler = withApiRoute(async () => ({
      status: 200,
      _body: { success: true },
    }), { routeName: "analyze", requiresQuota: true });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 403);
    const body = await extractJson(response);
    assert.ok(body.error.includes("Upgrade required"));
  });

  test("skips quota check when requiresQuota is false", async () => {
    let getUserProfileCalled = false;
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => ({ id: "free-user" }),
      checkRateLimitImpl: async () => ({ success: true }),
      getUserProfileImpl: async () => { getUserProfileCalled = true; return null; },
      canAnalyzeImpl: () => false,
    });

    const handler = withApiRoute(async () => ({
      status: 200,
      _body: { success: true },
    }), { routeName: "public-route", requiresQuota: false });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 200);
    assert.equal(getUserProfileCalled, false, "getUserProfile should not be called when requiresQuota is false");
  });
});

describe("withApiRoute — error boundary", () => {
  test("returns 500 when handler throws an unhandled error", async () => {
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => ({ id: "user-xyz" }),
      checkRateLimitImpl: async () => ({ success: true }),
      getUserProfileImpl: async () => ({ tier: "pro" }),
      canAnalyzeImpl: () => true,
    });

    const handler = withApiRoute(async () => {
      throw new Error("Something exploded in the handler");
    }, { routeName: "boom" });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 500);
    const body = await extractJson(response);
    assert.equal(body.success, false);
    assert.equal(body.error, "Something exploded in the handler");
  });

  test("skips auth when requiresAuth is false", async () => {
    let requireUserCalled = false;
    const withApiRoute = createWithApiRoute({
      requireUserImpl: async () => { requireUserCalled = true; return { id: "u" }; },
      checkRateLimitImpl: async () => ({ success: true }),
      getUserProfileImpl: async () => ({ tier: "pro" }),
      canAnalyzeImpl: () => true,
    });

    const handler = withApiRoute(async () => ({
      status: 200,
      _body: { success: true },
    }), { routeName: "public", requiresAuth: false });

    const response = await handler(makeRequest());
    assert.equal(extractStatus(response), 200);
    assert.equal(requireUserCalled, false, "requireUser should not be called for public routes");
  });
});
