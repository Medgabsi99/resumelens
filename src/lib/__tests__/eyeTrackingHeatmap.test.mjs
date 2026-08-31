import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Recruiter 6-Second Eye-Tracking Heatmap Engine", () => {
  const FIXATIONS = [
    { id: 1, timeSec: 0.8, target: "Header Section", dwellMs: 1100, intensity: "high" },
    { id: 2, timeSec: 2.2, target: "Experience #1 Header", dwellMs: 1400, intensity: "high" },
    { id: 3, timeSec: 3.6, target: "Experience #1 Bullet 1", dwellMs: 1500, intensity: "high" },
    { id: 4, timeSec: 4.8, target: "Skills Section", dwellMs: 1200, intensity: "medium" },
    { id: 5, timeSec: 5.8, target: "Education Section", dwellMs: 900, intensity: "low" },
  ];

  test("fixations are sequenced monotonically within 6-second window", () => {
    for (let i = 0; i < FIXATIONS.length - 1; i++) {
      assert.ok(FIXATIONS[i].timeSec < FIXATIONS[i + 1].timeSec);
    }
    assert.ok(FIXATIONS[FIXATIONS.length - 1].timeSec <= 6.0);
  });

  test("highest dwell time is concentrated on experience headers and lead bullets", () => {
    const highIntensityFixations = FIXATIONS.filter((f) => f.intensity === "high");
    assert.equal(highIntensityFixations.length, 3);
    assert.ok(highIntensityFixations.some((f) => f.target.includes("Experience #1")));
  });

  test("active fixation lookup matches scrubber timestamps accurately", () => {
    function getActiveFixation(currentSec) {
      return FIXATIONS.find(
        (f) => currentSec >= f.timeSec - 0.5 && currentSec <= f.timeSec + f.dwellMs / 1000
      );
    }

    const atHeader = getActiveFixation(0.9);
    assert.equal(atHeader?.id, 1);

    const atLeadBullet = getActiveFixation(3.8);
    assert.equal(atLeadBullet?.id, 3);
  });
});
