/**
 * Tests for ATS Fingerprinter & Vendor Reverse-Engineering Engine.
 * Verifies URL detection, company database mapping, 8-vendor scoring,
 * and ATS X-Ray tokenization.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  detectAtsVendorFromUrl,
  detectAtsVendorFromCompany,
  ATS_VENDOR_SPECS,
  KNOWN_COMPANY_ATS_MAP,
} from "../atsFingerprinter.ts";
import {
  simulateAtsVendors,
  simulateVendorXRay,
} from "../atsSimulatorEngine.ts";

const SAMPLE_RESUME = `ALEX MORGAN
alex.morgan@email.com • (555) 234-5678 • linkedin.com/in/alexmorgan • github.com/alexmorgan

PROFESSIONAL EXPERIENCE
Senior Full Stack Engineer | TechCorp Inc. | 05/2021 – Present
• Architected 6 high-throughput microservices using Node.js & TypeScript, reducing p99 latency by 45% across 150,000 DAU.
• Led migration to Next.js App Router, slashing initial bundle load times by 42%.

Software Engineer | Innovate Systems | 08/2018 – 04/2021
• Developed RESTful API services in Python handling 10M+ daily telemetry requests.

EDUCATION
B.S. in Computer Science | University of California, Berkeley | 2014 – 2018

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Frameworks: React, Next.js, Node.js, Express, TailwindCSS
Databases & Cloud: PostgreSQL, Redis, Docker, AWS (S3, EC2), CI/CD`;

// ─── ATS URL Detection Tests ──────────────────────────────────────────────────

describe("detectAtsVendorFromUrl — direct ATS domain matching", () => {
  test("detects Greenhouse from boards.greenhouse.io URL", () => {
    const res = detectAtsVendorFromUrl("https://boards.greenhouse.io/stripe/jobs/4821948");
    assert.equal(res.vendorId, "greenhouse");
    assert.equal(res.confidence, "Exact Match");
    assert.equal(res.source, "url_domain");
  });

  test("detects Workday from myworkdayjobs.com URL", () => {
    const res = detectAtsVendorFromUrl("https://netflix.wd1.myworkdayjobs.com/en-US/Netflix/job/Senior-Engineer_R1234");
    assert.equal(res.vendorId, "workday");
    assert.equal(res.confidence, "Exact Match");
  });

  test("detects Lever from jobs.lever.co URL", () => {
    const res = detectAtsVendorFromUrl("https://jobs.lever.co/retool/3e8a1a-4d2c-9a1b");
    assert.equal(res.vendorId, "lever");
    assert.equal(res.confidence, "Exact Match");
  });

  test("detects Ashby from jobs.ashbyhq.com URL", () => {
    const res = detectAtsVendorFromUrl("https://jobs.ashbyhq.com/figma/98d2-45e1-8b2c");
    assert.equal(res.vendorId, "ashby");
    assert.equal(res.confidence, "Exact Match");
  });

  test("detects Taleo from oraclecloud / taleo URL", () => {
    const res = detectAtsVendorFromUrl("https://apple.taleo.net/careersection/jobdetail.ftl?job=2003847");
    assert.equal(res.vendorId, "taleo");
    assert.equal(res.confidence, "Exact Match");
  });

  test("detects SmartRecruiters from smartrecruiters.com URL", () => {
    const res = detectAtsVendorFromUrl("https://jobs.smartrecruiters.com/Visa/12345-senior-engineer");
    assert.equal(res.vendorId, "smartrecruiters");
    assert.equal(res.confidence, "Exact Match");
  });

  test("detects iCIMS from icims.com URL", () => {
    const res = detectAtsVendorFromUrl("https://careers-amazon.icims.com/jobs/14589/view");
    assert.equal(res.vendorId, "icims");
    assert.equal(res.confidence, "Exact Match");
  });

  test("detects BambooHR from bamboohr.com URL", () => {
    const res = detectAtsVendorFromUrl("https://startup.bamboohr.com/careers/42");
    assert.equal(res.vendorId, "bamboohr");
    assert.equal(res.confidence, "Exact Match");
  });
});

// ─── Company Database Matching Tests ──────────────────────────────────────────

describe("detectAtsVendorFromCompany — company knowledge base", () => {
  test("resolves Stripe to Greenhouse", () => {
    const res = detectAtsVendorFromCompany("Stripe");
    assert.equal(res.vendorId, "greenhouse");
    assert.equal(res.confidence, "Exact Match");
  });

  test("resolves Figma to Ashby", () => {
    const res = detectAtsVendorFromCompany("Figma");
    assert.equal(res.vendorId, "ashby");
  });

  test("resolves Notion to Ashby", () => {
    const res = detectAtsVendorFromCompany("Notion");
    assert.equal(res.vendorId, "ashby");
  });

  test("resolves Netflix to Workday", () => {
    const res = detectAtsVendorFromCompany("Netflix");
    assert.equal(res.vendorId, "workday");
  });

  test("resolves Goldman Sachs to Taleo", () => {
    const res = detectAtsVendorFromCompany("Goldman Sachs");
    assert.equal(res.vendorId, "taleo");
  });

  test("falls back gracefully on unknown company name", () => {
    const res = detectAtsVendorFromCompany("Unknown Stealth Startup 123");
    assert.ok(res.vendorId);
    assert.equal(res.confidence, "Heuristic Estimate");
  });
});

// ─── ATS Vendor Simulation Tests ──────────────────────────────────────────────

describe("simulateAtsVendors — 8-vendor scoring matrix", () => {
  test("generates profiles for all 8 supported vendors", () => {
    const result = simulateAtsVendors(SAMPLE_RESUME);
    const expectedVendors = [
      "workday",
      "greenhouse",
      "lever",
      "ashby",
      "taleo",
      "smartrecruiters",
      "icims",
      "bamboohr",
    ];

    expectedVendors.forEach((v) => {
      assert.ok(result.profiles[v], `Missing vendor profile for ${v}`);
      assert.ok(result.profiles[v].matchScore >= 0 && result.profiles[v].matchScore <= 100);
      assert.ok(result.profiles[v].checks.length > 0);
    });
  });

  test("scores clean resume with standard dates and metrics above 80%", () => {
    const result = simulateAtsVendors(SAMPLE_RESUME);
    assert.ok(result.overallVendorScore >= 80, `Expected score >= 80, got ${result.overallVendorScore}`);
    assert.ok(result.profiles.workday.matchScore >= 85);
    assert.ok(result.profiles.greenhouse.matchScore >= 85);
    assert.ok(result.profiles.ashby.matchScore >= 85);
  });
});

// ─── ATS X-Ray Tokenizer Tests ────────────────────────────────────────────────

describe("simulateVendorXRay — text stream and anomaly extraction", () => {
  test("extracts clean sections and indexed keywords for Workday", () => {
    const xray = simulateVendorXRay(SAMPLE_RESUME, "workday");
    assert.equal(xray.vendorId, "workday");
    assert.ok(xray.parsedStream.includes("[WORKDAY INGEST: PROFESSIONAL EXPERIENCE]"));
    assert.ok(xray.extractedKeywords.length > 0);
    assert.ok(xray.extractedSections.length >= 3);
  });

  test("flags unquantified bullets for Ashby AI parser", () => {
    const unquantifiedResume = `EXPERIENCE\nDeveloper | Company | 2021 – 2023\nResponsible for doing frontend work and attending agile meetings.`;
    const xray = simulateVendorXRay(unquantifiedResume, "ashby");
    const anomaly = xray.detectedAnomalies.find((a) => a.warning.includes("Ashby AI Flag"));
    assert.ok(anomaly, "Expected Ashby to flag unquantified bullet");
  });

  test("flags unicode character encoding risk for Taleo legacy OCR", () => {
    const unicodeResume = `EXPERIENCE\nDeveloper | 2021 – 2023\n★ Designed high scale system.`;
    const xray = simulateVendorXRay(unicodeResume, "taleo");
    const anomaly = xray.detectedAnomalies.find((a) => a.warning.includes("Taleo OCR"));
    assert.ok(anomaly, "Expected Taleo to flag unicode special symbol");
  });
});
