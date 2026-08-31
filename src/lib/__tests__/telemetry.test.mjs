import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { telemetry } from "../telemetry/tracker.ts";

describe("Telemetry & Client Observability Engine", () => {
  beforeEach(() => {
    telemetry.clearBreadcrumbs();
  });

  test("addBreadcrumb pushes breadcrumbs and caps ring buffer at 20 entries", () => {
    for (let i = 1; i <= 25; i++) {
      telemetry.addBreadcrumb("ui", `User clicked button ${i}`, { index: i });
    }

    const breadcrumbs = telemetry.getBreadcrumbs();
    assert.equal(breadcrumbs.length, 20);
    assert.equal(breadcrumbs[0].message, "User clicked button 6");
    assert.equal(breadcrumbs[19].message, "User clicked button 25");
  });

  test("captureException serializes Standard Error objects with breadcrumbs", () => {
    telemetry.addBreadcrumb("navigation", "Navigated to /dashboard");
    const testError = new TypeError("Cannot read properties of undefined");

    const payload = telemetry.captureException(testError, { customField: "test" });

    assert.equal(payload.name, "TypeError");
    assert.equal(payload.message, "Cannot read properties of undefined");
    assert.ok(payload.stack?.includes("TypeError"));
    assert.equal(payload.breadcrumbs.length, 1);
    assert.equal(payload.breadcrumbs[0].message, "Navigated to /dashboard");
    assert.equal(payload.context?.customField, "test");
    assert.ok(payload.timestamp);
  });

  test("captureAiLatency records structured AI breadcrumb", () => {
    telemetry.captureAiLatency("analyzeResume", 1420, true);

    const breadcrumbs = telemetry.getBreadcrumbs();
    assert.equal(breadcrumbs.length, 1);
    assert.equal(breadcrumbs[0].category, "ai");
    assert.ok(breadcrumbs[0].message.includes("1420ms (success)"));
    assert.equal(breadcrumbs[0].data?.durationMs, 1420);
  });
});
