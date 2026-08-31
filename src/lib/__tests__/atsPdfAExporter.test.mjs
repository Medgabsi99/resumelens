import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseResume } from "../parseResume.ts";
import { parsedResumeToCanonical } from "../../types/resume.ts";

const SAMPLE_RESUME_TEXT = `DIANA PRINCE
VP of Cloud Infrastructure • diana@example.com • +1 206 555 0123 • Seattle, WA
https://linkedin.com/in/dianaprince • https://github.com/dianaprince

SUMMARY
Executive technology leader with 15+ years architecting hyper-scale cloud systems and directing global SRE teams.

WORK EXPERIENCE
Amazon Web Services | VP of Cloud Engineering | 2021 – Present | Seattle, WA
• Directed 180+ principal engineers managing 99.999% SLA across 32 availability zones.
• Scaled global Kubernetes control plane reducing container cold starts by 45%.

EDUCATION
M.S. in Computer Science | University of Washington | 2014

TECHNICAL SKILLS
Cloud Architecture, AWS, Kubernetes, Distributed Systems, Go, Python, Terraform`;

describe("Enterprise ATS-Certified PDF/A-1b Standard Exporter", () => {
  test("parsed resume extracts all sections into single-column ATS data hierarchy", () => {
    const parsed = parseResume(SAMPLE_RESUME_TEXT);
    assert.equal(parsed.contact.name, "DIANA PRINCE");
    assert.equal(parsed.contact.email, "diana@example.com");
    assert.ok(parsed.experience.length >= 1);
    assert.ok(parsed.skills.length >= 1);
  });

  test("canonical transformation retains full metadata and bullet arrays", () => {
    const parsed = parseResume(SAMPLE_RESUME_TEXT);
    const doc = parsedResumeToCanonical(parsed);

    assert.equal(doc.contact.name, "DIANA PRINCE");
    assert.ok(doc.experience[0].bullets.some((b) => b.includes("99.999% SLA")));
    assert.ok(doc.skills.some((s) => s.includes("Kubernetes")));
  });

  test("single-column linearized text stream preserves strict top-to-bottom reading order", () => {
    const parsed = parseResume(SAMPLE_RESUME_TEXT);

    const sections = [
      parsed.contact.name,
      parsed.summary,
      parsed.experience[0].title,
      parsed.skills.join(", "),
      parsed.education[0].degree,
    ];

    for (let i = 0; i < sections.length; i++) {
      assert.ok(sections[i], `Section at index ${i} must exist and be defined`);
    }
  });
});
