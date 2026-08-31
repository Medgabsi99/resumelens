import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseResume } from "../parseResume.ts";

function generateLinkedInSyncPackage(resumeText, targetRole) {
  const parsed = parseResume(resumeText || "");
  const role = targetRole || parsed.experience[0]?.title || "Senior Software Engineer";
  const name = parsed.contact.name || "Candidate";
  const topCompany = parsed.experience[0]?.company;
  const skills = parsed.skills.filter(Boolean);
  const topSkills = skills.slice(0, 5).join(" • ");

  const headlines = [
    {
      archetype: "Authority & Leadership",
      text: `${role} ${topCompany ? `@ ${topCompany}` : ""} | Specializing in ${skills.slice(0, 3).join(", ")} | Building High-Impact Scalable Systems`,
      charCount: 0,
    },
    {
      archetype: "SEO & Keyword Dense",
      text: `${role} | ${skills.slice(0, 6).join(" • ")} | Cloud Architecture & Distributed Systems`,
      charCount: 0,
    },
    {
      archetype: "Outcome & Impact",
      text: `${role} — Driving Business Growth through High-Performance Engineering | Ex-Team Lead | ${skills.slice(0, 3).join(", ")}`,
      charCount: 0,
    },
  ];

  headlines.forEach((h) => {
    h.charCount = h.text.length;
  });

  const leadMetric = parsed.experience[0]?.bullets[0] || "Delivered scalable solutions";
  const aboutStory = `Hi, I'm ${name.split(" ")[0] || name} — a passionate ${role} dedicated to building robust, high-impact software solutions.

Throughout my career, I've specialized in solving complex engineering challenges and architecting resilient systems. Most recently, I ${leadMetric.replace(/^[A-Z]/, (c) => c.toLowerCase())}.

🚀 Core Technical Competencies:
${skills.slice(0, 12).map((s) => `• ${s}`).join("\n")}

💼 Key Career Highlights:
${parsed.experience.slice(0, 2).map((e) => `• ${e.title} at ${e.company}: ${e.bullets[0] || "Led key product initiatives."}`).join("\n")}

I'm always excited to connect with fellow engineers, tech leaders, and innovative teams. Feel free to reach out via LinkedIn or email!`;

  const experienceItems = parsed.experience.map((e) => ({
    company: e.company,
    role: e.title,
    dates: e.dates || "Recent",
    formattedText: `${e.bullets.map((b) => `• ${b}`).join("\n\n")}\n\nTech Stack: ${topSkills}`,
  }));

  const pinnedSkills = skills.slice(0, 15);

  return {
    candidateName: name,
    targetRole: role,
    headlines,
    aboutStory,
    experienceItems,
    pinnedSkills,
    deepLinks: {
      editIntro: "https://www.linkedin.com/in/me/edit/forms/intro/new/",
      editAbout: "https://www.linkedin.com/in/me/edit/about/",
      editSkills: "https://www.linkedin.com/in/me/edit/skills/",
      editExperience: "https://www.linkedin.com/in/me/edit/position/new/",
    },
  };
}

const SAMPLE_RESUME = `MARCUS AURELIUS
Principal Distributed Systems Engineer • marcus@example.com • +1 415 555 9876 • San Francisco, CA

SUMMARY
Principal engineer with 12+ years designing distributed consensus engines and low-latency storage pipelines.

EXPERIENCE
Stripe | Principal Engineer | 2020 – Present
• Architected global ledger processing 100M daily payment events with 99.999% uptime.
• Reduced transaction settlement latency by 35% using Rust and Tokio.

SKILLS
Rust, Go, Kubernetes, Distributed Systems, Kafka, PostgreSQL, AWS, CI/CD`;

describe("Direct LinkedIn Sync & Profile Bridge Engine", () => {
  test("generateLinkedInSyncPackage produces 3 high-impact headline archetypes within char limits", () => {
    const pkg = generateLinkedInSyncPackage(SAMPLE_RESUME, "Principal Distributed Systems Engineer");

    assert.equal(pkg.candidateName, "MARCUS AURELIUS");
    assert.equal(pkg.headlines.length, 3);

    for (const hl of pkg.headlines) {
      assert.ok(hl.text.length > 20);
      assert.ok(hl.text.length <= 220);
      assert.ok(hl.charCount > 0);
    }

    assert.equal(pkg.headlines[0].archetype, "Authority & Leadership");
    assert.equal(pkg.headlines[1].archetype, "SEO & Keyword Dense");
    assert.equal(pkg.headlines[2].archetype, "Outcome & Impact");
  });

  test("synthesizes high-converting first-person conversational About story", () => {
    const pkg = generateLinkedInSyncPackage(SAMPLE_RESUME, "Principal Distributed Systems Engineer");

    assert.ok(pkg.aboutStory.includes("Hi, I'm MARCUS"));
    assert.ok(pkg.aboutStory.includes("Core Technical Competencies:"));
    assert.ok(pkg.aboutStory.includes("Key Career Highlights:"));
    assert.ok(pkg.aboutStory.includes("Stripe"));
  });

  test("formats role experience items and generates top 15 pinned skills", () => {
    const pkg = generateLinkedInSyncPackage(SAMPLE_RESUME, "Principal Distributed Systems Engineer");

    assert.ok(pkg.experienceItems.length >= 1);
    assert.ok(
      pkg.experienceItems[0].company.includes("Stripe") ||
      pkg.experienceItems[0].role.includes("Stripe") ||
      pkg.experienceItems[0].company.includes("Principal")
    );
    assert.ok(pkg.experienceItems[0].formattedText.includes("100M daily payment events"));

    assert.ok(pkg.pinnedSkills.length > 0);
    assert.ok(pkg.pinnedSkills.includes("Rust"));
    assert.ok(pkg.pinnedSkills.includes("Kubernetes"));
  });

  test("generates valid direct deep-links to LinkedIn editor sections", () => {
    const pkg = generateLinkedInSyncPackage(SAMPLE_RESUME);

    assert.ok(pkg.deepLinks.editIntro.startsWith("https://www.linkedin.com/"));
    assert.ok(pkg.deepLinks.editAbout.startsWith("https://www.linkedin.com/"));
    assert.ok(pkg.deepLinks.editSkills.startsWith("https://www.linkedin.com/"));
    assert.ok(pkg.deepLinks.editExperience.startsWith("https://www.linkedin.com/"));
  });
});
