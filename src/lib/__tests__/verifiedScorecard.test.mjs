import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateScorePercentile,
  generateBadgeMarkdown,
  generateBadgeHtml,
  getLinkedInShareUrl,
  getTwitterShareUrl,
} from "../verifiedScorecard.ts";

describe("Public Verified Scorecard & Viral Share Engine", () => {
  test("calculateScorePercentile maps scores accurately to tiers", () => {
    assert.deepEqual(calculateScorePercentile(96), { percentile: 99, tier: "Top 1%" });
    assert.deepEqual(calculateScorePercentile(91), { percentile: 95, tier: "Top 5%" });
    assert.deepEqual(calculateScorePercentile(84), { percentile: 85, tier: "Top 15%" });
    assert.deepEqual(calculateScorePercentile(72), { percentile: 70, tier: "Top 30%" });
    assert.equal(calculateScorePercentile(65).tier, "Applicant");
  });

  test("generateBadgeMarkdown creates shields.io compatible markdown link", () => {
    const url = "https://resumelens.app/verify/test-123";
    const md = generateBadgeMarkdown(94, url);

    assert.ok(md.startsWith("[![ResumeLens ATS Score]"));
    assert.ok(md.includes("ATS%20Score-94%2F100-brightgreen"));
    assert.ok(md.endsWith(`](${url})`));
  });

  test("generateBadgeHtml creates clickable HTML snippet", () => {
    const url = "https://resumelens.app/verify/test-123";
    const html = generateBadgeHtml(88, url);

    assert.ok(html.startsWith(`<a href="${url}"`));
    assert.ok(html.includes("88%2F100"));
  });

  test("getLinkedInShareUrl & getTwitterShareUrl format intent URLs properly", () => {
    const url = "https://resumelens.app/verify/test-123";
    const linkedInUrl = getLinkedInShareUrl(url, 92, "Principal Engineer");
    const twitterUrl = getTwitterShareUrl(url, 92, "Principal Engineer");

    assert.ok(linkedInUrl.startsWith("https://www.linkedin.com/feed/?shareActive=true&text="));
    assert.ok(linkedInUrl.includes(encodeURIComponent(url)));

    assert.ok(twitterUrl.startsWith("https://twitter.com/intent/tweet?text="));
    assert.ok(twitterUrl.includes(encodeURIComponent(url)));
  });
});
