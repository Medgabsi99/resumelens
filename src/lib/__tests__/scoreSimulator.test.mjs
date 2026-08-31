import { test, describe } from "node:test";
import assert from "node:assert/strict";

function calculateSimulatedScore({
  baselineScore = 70,
  selectedKeywords = [],
  metricCount = 0,
  usePowerVerbs = false,
  useCleanFormat = false,
}) {
  const pointsFromKeywords = selectedKeywords.length * 4;
  const pointsFromMetrics = metricCount * 3;
  const pointsFromVerbs = usePowerVerbs ? 5 : 0;
  const pointsFromFormat = useCleanFormat ? 4 : 0;

  const totalBoost = pointsFromKeywords + pointsFromMetrics + pointsFromVerbs + pointsFromFormat;
  return {
    totalBoost,
    simulatedScore: Math.min(99, Math.max(0, baselineScore + totalBoost)),
  };
}

describe("ScoreSimulatorSandbox Logic", () => {
  test("calculates boost accurately with multiple keywords and metrics", () => {
    const result = calculateSimulatedScore({
      baselineScore: 68,
      selectedKeywords: ["Kubernetes", "AWS", "GraphQL"], // +12 pts
      metricCount: 3, // +9 pts
      usePowerVerbs: true, // +5 pts
      useCleanFormat: true, // +4 pts
    });

    assert.equal(result.totalBoost, 30);
    assert.equal(result.simulatedScore, 98);
  });

  test("caps simulated score strictly at 99 max", () => {
    const result = calculateSimulatedScore({
      baselineScore: 92,
      selectedKeywords: ["A", "B", "C", "D"], // +16 pts
      metricCount: 5, // +15 pts
      usePowerVerbs: true,
      useCleanFormat: true,
    });

    assert.equal(result.simulatedScore, 99);
  });

  test("handles zero selections with zero boost", () => {
    const result = calculateSimulatedScore({
      baselineScore: 75,
      selectedKeywords: [],
      metricCount: 0,
      usePowerVerbs: false,
      useCleanFormat: false,
    });

    assert.equal(result.totalBoost, 0);
    assert.equal(result.simulatedScore, 75);
  });
});
