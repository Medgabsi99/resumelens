/**
 * linkedInBridge.ts
 *
 * Direct LinkedIn Sync & Profile Bridge Engine.
 * Transforms optimized resume documents into high-converting LinkedIn profile assets
 * and generates deep-links into LinkedIn's native profile edit forms.
 */

import { parseResume, type ParsedResume } from "./parseResume";

export interface LinkedInHeadline {
  archetype: "Authority & Leadership" | "SEO & Keyword Dense" | "Outcome & Impact";
  text: string;
  charCount: number;
}

export interface LinkedInExperienceItem {
  company: string;
  role: string;
  dates: string;
  formattedText: string;
}

export interface LinkedInSyncPackage {
  candidateName: string;
  targetRole: string;
  headlines: LinkedInHeadline[];
  aboutStory: string;
  experienceItems: LinkedInExperienceItem[];
  pinnedSkills: string[];
  deepLinks: {
    editIntro: string;
    editAbout: string;
    editSkills: string;
    editExperience: string;
  };
}

/**
 * Compiles an optimized LinkedIn sync package from resume text.
 */
export function generateLinkedInSyncPackage(
  resumeText: string,
  targetRole?: string
): LinkedInSyncPackage {
  const parsed = parseResume(resumeText || "");
  const role = targetRole || parsed.experience[0]?.title || "Senior Software Engineer";
  const name = parsed.contact.name || "Candidate";
  const topCompany = parsed.experience[0]?.company;
  const skills = parsed.skills.filter(Boolean);
  const topSkills = skills.slice(0, 5).join(" • ");

  // 1. Generate 3 Headline Archetypes (Max 220 chars)
  const headlines: LinkedInHeadline[] = [
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

  // 2. Generate First-Person Conversational "About" Storyteller
  const leadMetric = parsed.experience[0]?.bullets[0] || "Delivered scalable solutions";
  const aboutStory = `Hi, I'm ${name.split(" ")[0] || name} — a passionate ${role} dedicated to building robust, high-impact software solutions.

Throughout my career, I've specialized in solving complex engineering challenges and architecting resilient systems. Most recently, I ${leadMetric.replace(/^[A-Z]/, (c) => c.toLowerCase())}.

🚀 Core Technical Competencies:
${skills
  .slice(0, 12)
  .map((s) => `• ${s}`)
  .join("\n")}

💼 Key Career Highlights:
${parsed.experience
  .slice(0, 2)
  .map((e) => `• ${e.title} at ${e.company}: ${e.bullets[0] || "Led key product initiatives."}`)
  .join("\n")}

I'm always excited to connect with fellow engineers, tech leaders, and innovative teams. Feel free to reach out via LinkedIn or email!`;

  // 3. Experience Items Format
  const experienceItems: LinkedInExperienceItem[] = parsed.experience.map((e) => ({
    company: e.company,
    role: e.title,
    dates: e.dates || "Recent",
    formattedText: `${e.bullets.map((b) => `• ${b}`).join("\n\n")}\n\nTech Stack: ${topSkills}`,
  }));

  // 4. Pinned Skills (Top 15 ranked)
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
