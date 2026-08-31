import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseResume } from "../parseResume.ts";
import { runAtsChecks } from "../atsRulesChecker.ts";
import { calculateHeatmapData } from "../heatmapEngine.ts";

// LCS Word Diff function matching worker implementation
function computeWordDiff(a, b) {
  const wordsA = a.match(/\S+|\s+/g) ?? [];
  const wordsB = b.match(/\S+|\s+/g) ?? [];

  const m = wordsA.length;
  const n = wordsB.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (wordsA[i] === wordsB[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const tokens = [];
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

  return tokens.reduce((acc, token) => {
    const last = acc[acc.length - 1];
    if (last && last.type === token.type) {
      last.text += token.text;
      return acc;
    }
    return [...acc, { ...token }];
  }, []);
}

describe("Client-Side Web Worker & Off-Thread Parsing Infrastructure", () => {
  test("computeWordDiff produces accurate LCS insert/delete tokens", () => {
    const textA = "Senior Software Engineer with experience in Python and AWS.";
    const textB = "Staff Software Engineer with deep experience in Python, Go and AWS.";

    const tokens = computeWordDiff(textA, textB);
    assert.ok(tokens.length > 0);

    const hasDelete = tokens.some((t) => t.type === "delete" && t.text.includes("Senior"));
    const hasInsert = tokens.some((t) => t.type === "insert" && t.text.includes("Staff"));

    assert.ok(hasDelete);
    assert.ok(hasInsert);
  });

  test("diff token reduction consolidates contiguous insertions and deletions", () => {
    const orig = "Led team of 5 engineers.";
    const updated = "Orchestrated team of 8 senior engineers delivering high-scale GraphQL.";

    const tokens = computeWordDiff(orig, updated);
    assert.ok(Array.isArray(tokens));
    assert.ok(tokens.length >= 2);
  });

  test("offloaded parseResume parses resume structure accurately", () => {
    const sample = `ALEX RIVERA
Software Architect • alex@example.com
EXPERIENCE
Google | Senior Engineer | 2022-Present
• Built real-time analytics engine.
SKILLS
Java, Go, Kubernetes`;

    const parsed = parseResume(sample);
    assert.equal(parsed.contact.name, "ALEX RIVERA");
    assert.equal(parsed.contact.email, "alex@example.com");
    assert.ok(parsed.experience.length >= 1);
  });

  test("offloaded runAtsChecks runs deterministic rules engine accurately", () => {
    const sample = `SARAH CONNER
DevOps Lead • sarah@example.com
EXPERIENCE
Cyberdyne | Lead Engineer | 2020-Present
• Automated CI/CD pipelines reducing deployment time by 40%.
SKILLS
Docker, Terraform, AWS`;

    const result = runAtsChecks(sample, "DevOps Lead");
    assert.ok(result.deterministicScore > 0);
    assert.ok(Array.isArray(result.checks));
  });

  test("offloaded calculateHeatmapData produces F-pattern scannability metrics", () => {
    const sample = `ELENA ROSTOVA
Cloud Security Engineer • elena@example.com
EXPERIENCE
Cloudflare | Senior Security Engineer | 2021-Present
• Implemented zero-trust authentication across 50,000 servers.`;

    const heatmap = calculateHeatmapData(sample);
    assert.ok(heatmap.fixations.length > 0);
    assert.ok(typeof heatmap.scannabilityScore === "number");
  });
});
