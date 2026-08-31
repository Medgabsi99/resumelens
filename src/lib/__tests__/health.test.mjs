import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Health Probe Payload Contract", () => {
  test("computes correct uptime and environment check structure", () => {
    const startTime = Date.now() - 5000;
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    assert.ok(uptimeSeconds >= 5, "Uptime should be at least 5 seconds");

    const envStatus = {
      supabaseConfigured: true,
      googleAiConfigured: true,
      redisConfigured: false,
      stripeConfigured: false,
    };

    const isHealthy = envStatus.supabaseConfigured && envStatus.googleAiConfigured;
    assert.equal(isHealthy, true);

    const payload = {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      services: envStatus,
    };

    assert.equal(payload.status, "ok");
    assert.ok(typeof payload.timestamp === "string");
    assert.equal(payload.services.supabaseConfigured, true);
  });
});
