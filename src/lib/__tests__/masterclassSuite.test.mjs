import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateStarCoaching } from "../ai/starInterviewCoach.ts";
import { getSkillPathway } from "../skillBridge.ts";
import { detectAtsVendorFromUrl, ATS_VENDOR_SPECS } from "../atsFingerprinter.ts";
import { isSoundEnabled, setSoundEnabled } from "../soundFx.ts";

describe("Masterclass 6-Pillar Luxury Suite Tests", () => {
  describe("Pillar 1 & 2: AI STAR Interview Coach", () => {
    it("Generates 4-part STAR outline from performance bullet point", () => {
      const bullet = "Architected 6 microservices in Node.js, slashing p99 latency by 45% across 150K DAU.";
      const coach = generateStarCoaching(bullet, "Senior Backend Engineer");

      assert.ok(coach.predictedQuestion.includes("latency") || coach.predictedQuestion.includes("bottleneck") || coach.predictedQuestion.includes("Senior Backend Engineer"));
      assert.ok(coach.situation.length > 20);
      assert.ok(coach.task.length > 20);
      assert.ok(coach.action.length > 20);
      assert.ok(coach.result.includes("45%"));
      assert.ok(coach.trapToAvoid.length > 20);
      assert.equal(coach.recommendedDurationSec, 90);
    });
  });

  describe("Pillar 3: Target ATS Vendor Fingerprinter", () => {
    it("Identifies Greenhouse, Lever, Workday, and Ashby URLs", () => {
      assert.equal(detectAtsVendorFromUrl("https://boards.greenhouse.io/stripe/jobs/123").vendorId, "greenhouse");
      assert.equal(detectAtsVendorFromUrl("https://jobs.lever.co/netflix/456").vendorId, "lever");
      assert.equal(detectAtsVendorFromUrl("https://myworkdayjobs.com/target/789").vendorId, "workday");
      assert.equal(detectAtsVendorFromUrl("https://jobs.ashbyhq.com/openai/101").vendorId, "ashby");
    });

    it("Retrieves complete vendor specifications with failure modes and strategies", () => {
      const workdaySpec = ATS_VENDOR_SPECS.workday;
      assert.ok(workdaySpec);
      assert.equal(workdaySpec.name, "Workday ATS");
      assert.ok(workdaySpec.failureModes.length >= 3);
      assert.ok(workdaySpec.recommendedStrategy.length >= 3);
    });
  });

  describe("Pillar 5: Skill Gap Learning Pathways", () => {
    it("Maps missing AWS, Kubernetes, and TypeScript skills to credentials and project blueprints", () => {
      const aws = getSkillPathway("AWS");
      assert.equal(aws.category, "cloud");
      assert.ok(aws.certification.name.includes("AWS Certified"));
      assert.ok(aws.portfolioProject.resumeBullet.includes("AWS Lambda"));

      const k8s = getSkillPathway("Kubernetes");
      assert.equal(k8s.category, "devops");
      assert.ok(k8s.certification.badge.includes("CKA"));

      const ts = getSkillPathway("TypeScript");
      assert.equal(ts.category, "frontend");
      assert.ok(ts.freeTutorial.title.includes("TypeScript"));
    });

    it("Provides clean generic fallback for novel technical keywords", () => {
      const custom = getSkillPathway("ZigLang");
      assert.equal(custom.skill, "ZigLang");
      assert.ok(custom.certification.name.includes("ZigLang"));
      assert.ok(custom.portfolioProject.resumeBullet.includes("ZigLang"));
    });
  });

  describe("Pillar 6: Audio & Soundscape Toggle", () => {
    it("Safely handles headless server environments", () => {
      assert.equal(typeof isSoundEnabled(), "boolean");
      setSoundEnabled(true);
      setSoundEnabled(false);
    });
  });
});
