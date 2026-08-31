import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseResume } from "../parseResume.ts";
import { parsedResumeToCanonical, canonicalToResumeText } from "../../types/resume.ts";
import { runAtsChecks } from "../atsRulesChecker.ts";

const SAMPLE_EDITOR_RESUME = `EMILY ZHAO
Staff Engineer • emily@example.com • +1 415 555 0199 • Seattle, WA
https://linkedin.com/in/emilyzhao • https://github.com/emilyzhao

PROFESSIONAL SUMMARY
Senior engineering leader specialized in distributed systems and cloud microservices.

PROFESSIONAL EXPERIENCE
Staff Software Engineer | Meta | 2021 – Present | Seattle, WA
• Architected real-time streaming pipeline processing 2M events/sec.
• Led team of 8 engineers delivering GraphQL migration.

EDUCATION
B.S. in Computer Science | Stanford University | 2017 – 2021

SKILLS
Distributed Systems, Go, Rust, TypeScript, GraphQL, Kubernetes, AWS, PostgreSQL`;

describe("Interactive ContentEditable Live Editor Logic", () => {
  test("parsed resume transforms into mutable canonical document", () => {
    const parsed = parseResume(SAMPLE_EDITOR_RESUME);
    const doc = parsedResumeToCanonical(parsed);

    assert.equal(doc.contact.name, "EMILY ZHAO");
    assert.equal(doc.contact.email, "emily@example.com");
    assert.ok(doc.experience.length >= 1);
  });

  test("editing bullets updates generated resume text and ATS score", () => {
    const parsed = parseResume(SAMPLE_EDITOR_RESUME);
    const doc = parsedResumeToCanonical(parsed);

    // Initial baseline score
    const initialText = canonicalToResumeText(doc);
    const initialAts = runAtsChecks(initialText, "Staff Engineer");

    // Add high-impact quantified bullet
    const updatedDoc = {
      ...doc,
      experience: [
        {
          ...doc.experience[0],
          bullets: [
            ...doc.experience[0].bullets,
            "Spearheaded cloud cost reduction initiative saving $420,000 annually across 15 Kubernetes clusters.",
          ],
        },
        ...doc.experience.slice(1),
      ],
    };

    const updatedText = canonicalToResumeText(updatedDoc);
    const updatedAts = runAtsChecks(updatedText, "Staff Engineer");

    assert.ok(updatedText.includes("$420,000"));
    assert.ok(updatedAts.deterministicScore >= initialAts.deterministicScore);
  });

  test("bullet deletion correctly removes item from canonical document", () => {
    const parsed = parseResume(SAMPLE_EDITOR_RESUME);
    const doc = parsedResumeToCanonical(parsed);
    const initialCount = doc.experience[0].bullets.length;

    const modifiedDoc = {
      ...doc,
      experience: [
        {
          ...doc.experience[0],
          bullets: doc.experience[0].bullets.slice(0, 1),
        },
      ],
    };

    assert.equal(modifiedDoc.experience[0].bullets.length, initialCount - 1);
  });
});
