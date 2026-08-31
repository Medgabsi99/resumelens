import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parsedResumeToCanonical,
  canonicalToParsedResume,
  canonicalToResumeText,
} from "../../types/resume.ts";
import { parseResume } from "../parseResume.ts";

const SAMPLE_RESUME_TEXT = `ALEX RIVERA
San Francisco, CA • alex.rivera@example.com • (555) 234-5678 • linkedin.com/in/alexrivera • github.com/alexrivera

PROFESSIONAL SUMMARY
Senior Full-Stack Engineer with 6+ years of experience building high-scale web platforms.

PROFESSIONAL EXPERIENCE
Senior Software Engineer | CloudScale Technologies | 2021 – Present
• Architected microservices in TypeScript, serving 250,000+ daily active users.
• Reduced frontend bundle load times by 38% using Next.js App Router.

Software Engineer | Innovate Labs | 2018 – 2021
• Built customer dashboard in React and TailwindCSS.

EDUCATION
B.S. in Computer Science | UC Berkeley | 2014 – 2018

TECHNICAL SKILLS
TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS`;

describe("Canonical ResumeDocument Schema & Transformers", () => {
  test("parseResume + parsedResumeToCanonical correctly parses raw text into canonical document", () => {
    const parsed = parseResume(SAMPLE_RESUME_TEXT);
    const doc = parsedResumeToCanonical(parsed);

    assert.equal(doc.contact.name, "ALEX RIVERA");
    assert.equal(doc.contact.email, "alex.rivera@example.com");
    assert.equal(doc.contact.phone, "(555) 234-5678");
    assert.equal(doc.contact.location, "San Francisco, CA");
    assert.ok(doc.contact.linkedin?.includes("linkedin.com/in/alexrivera"));
    assert.ok(doc.contact.github?.includes("github.com/alexrivera"));

    assert.ok(doc.summary?.includes("Senior Full-Stack Engineer"));
    assert.equal(doc.experience.length, 2);
    assert.equal(doc.experience[0].company, "CloudScale Technologies");
    assert.equal(doc.experience[0].bullets.length, 2);

    assert.equal(doc.education.length, 1);
    assert.equal(doc.education[0].school, "UC Berkeley");

    assert.ok(doc.skills.includes("TypeScript"));
    assert.ok(doc.skills.includes("React"));
  });

  test("parsedResumeToCanonical and canonicalToParsedResume maintain bidirectional fidelity", () => {
    const originalParsed = {
      contact: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "123-456-7890",
        location: "New York, NY",
        links: ["https://linkedin.com/in/janedoe", "https://github.com/janedoe"],
      },
      summary: "Senior PM with track record in PLG.",
      experience: [
        {
          title: "Lead PM",
          company: "Tech Corp",
          dates: "2020 - Present",
          bullets: ["Grew ARR by 40%."],
        },
      ],
      education: [
        {
          degree: "MBA",
          school: "Columbia",
          dates: "2018 - 2020",
        },
      ],
      skills: ["Product Strategy", "SQL", "A/B Testing"],
      certifications: ["PMP Certified"],
    };

    const canonical = parsedResumeToCanonical(originalParsed);
    assert.equal(canonical.contact.name, "Jane Doe");
    assert.equal(canonical.contact.linkedin, "https://linkedin.com/in/janedoe");

    const roundTripped = canonicalToParsedResume(canonical);
    assert.equal(roundTripped.contact.name, originalParsed.contact.name);
    assert.equal(roundTripped.experience[0].title, "Lead PM");
    assert.equal(roundTripped.skills.length, 3);
    assert.equal(roundTripped.certifications?.[0], "PMP Certified");
  });

  test("canonicalToResumeText produces clean, structured plaintext", () => {
    const parsed = parseResume(SAMPLE_RESUME_TEXT);
    const doc = parsedResumeToCanonical(parsed);
    const serializedText = canonicalToResumeText(doc);

    assert.ok(serializedText.includes("ALEX RIVERA"));
    assert.ok(serializedText.includes("PROFESSIONAL SUMMARY"));
    assert.ok(serializedText.includes("PROFESSIONAL EXPERIENCE"));
    assert.ok(serializedText.includes("TECHNICAL SKILLS"));
    assert.ok(serializedText.includes("CloudScale Technologies"));
  });
});
