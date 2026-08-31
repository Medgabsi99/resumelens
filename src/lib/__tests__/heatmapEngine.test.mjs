import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateHeatmapData } from "../heatmapEngine.ts";

test("calculateHeatmapData - returns empty structure for empty string", () => {
  const result = calculateHeatmapData("");
  assert.equal(result.fixations.length, 0);
  assert.equal(result.scannabilityScore, 0);
  assert.ok(result.summary.includes("No text"));
});

test("calculateHeatmapData - generates fixations and scores metric visibility", () => {
  const resume = `
    Alex Rivera
    alex@example.com | (555) 123-4567

    EXPERIENCE
    Lead Engineer at CloudScale
    - Drove 45% increase in user retention and cut costs by $150k annually.
    - Improved latency by 70% for 200k users.
    - Grew revenue by 35% year over year.

    EDUCATION
    BS in Computer Science
  `;

  const result = calculateHeatmapData(resume);
  assert.ok(result.fixations.length >= 3, "Should detect multiple fixations");
  assert.ok(result.scannabilityScore >= 40, "Scannability should be >= 40 for formatted resume");
  assert.ok(result.metricVisibilityScore > 0, "Should detect quantified metrics");
  assert.ok(result.topAttractors.length > 0, "Should identify top attractors");
});
