/**
 * Canonical ResumeDocument Schema & Universal Transformers
 *
 * Single Source of Truth across:
 * - Raw string resume parsing
 * - Live web preview templates
 * - Interactive visual editors
 * - High-resolution PDF export engines
 */

import type { ParsedResume } from "../lib/parseResume";

export interface ResumeContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  links?: string[];
}

export interface ResumeExperience {
  id?: string;
  title: string;
  company: string;
  location?: string;
  dates?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface ResumeEducation {
  id?: string;
  degree: string;
  school: string;
  location?: string;
  dates?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  details?: string;
  bullets?: string[];
}

export interface ResumeProject {
  id?: string;
  name: string;
  description: string;
  link?: string;
  technologies?: string[];
  bullets?: string[];
}

export interface ResumeSkillGroup {
  category?: string;
  items: string[];
}

export interface ResumeDocument {
  id?: string;
  version?: string;
  contact: ResumeContact;
  summary?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  skillGroups?: ResumeSkillGroup[];
  projects?: ResumeProject[];
  certifications?: string[];
  languages?: string[];
  awards?: string[];
  customSections?: {
    title: string;
    content: string[] | string;
  }[];
}

// ─── Bidirectional Converters & Transformers ─────────────────────────────────

/**
 * Transforms a ParsedResume object into the canonical ResumeDocument model.
 */
export function parsedResumeToCanonical(parsed: ParsedResume): ResumeDocument {
  return {
    contact: {
      name: parsed.contact?.name || "Candidate Name",
      email: parsed.contact?.email,
      phone: parsed.contact?.phone,
      location: parsed.contact?.location,
      links: parsed.contact?.links || [],
      linkedin: parsed.contact?.links?.find((l) => /linkedin\.com/i.test(l)),
      github: parsed.contact?.links?.find((l) => /github\.com/i.test(l)),
      website: parsed.contact?.links?.find((l) => !/linkedin|github/i.test(l)),
    },
    summary: parsed.summary,
    experience: (parsed.experience || []).map((exp, i) => ({
      id: `exp-${i}`,
      title: exp.title,
      company: exp.company,
      location: exp.location,
      dates: exp.dates,
      bullets: exp.bullets || [],
    })),
    education: (parsed.education || []).map((edu, i) => {
      let degree = edu.degree;
      let school = edu.school;
      if (!school && degree.includes("|")) {
        const parts = degree.split("|").map((s) => s.trim());
        degree = parts[0] || "";
        school = parts[1] || "";
      }
      return {
        id: `edu-${i}`,
        degree,
        school,
        dates: edu.dates,
        details: edu.details,
      };
    }),
    skills: parsed.skills || [],
    projects: (parsed.projects || []).map((p, i) => ({
      id: `proj-${i}`,
      name: p.name,
      description: p.description,
    })),
    certifications: parsed.certifications,
    languages: parsed.languages,
    awards: parsed.awards,
  };
}

/**
 * Converts a canonical ResumeDocument into a ParsedResume for backward compatibility.
 */
export function canonicalToParsedResume(doc: ResumeDocument): ParsedResume {
  return {
    contact: {
      name: doc.contact.name,
      email: doc.contact.email,
      phone: doc.contact.phone,
      location: doc.contact.location,
      links:
        doc.contact.links ||
        ([doc.contact.linkedin, doc.contact.github, doc.contact.website].filter(
          Boolean
        ) as string[]),
    },
    summary: doc.summary,
    experience: (doc.experience || []).map((exp) => ({
      title: exp.title,
      company: exp.company,
      location: exp.location,
      dates: exp.dates,
      bullets: exp.bullets,
    })),
    education: (doc.education || []).map((edu) => ({
      degree: edu.degree,
      school: edu.school,
      dates: edu.dates,
      details: edu.details,
    })),
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    projects: doc.projects?.map((p) => ({
      name: p.name,
      description: p.description,
    })),
    certifications: doc.certifications,
    languages: doc.languages,
    awards: doc.awards,
  };
}

/**
 * Serializes a canonical ResumeDocument back into clean, formatted plaintext.
 */
export function canonicalToResumeText(doc: ResumeDocument): string {
  const parts: string[] = [];

  // Header / Contact
  if (doc.contact?.name) {
    parts.push(doc.contact.name.toUpperCase());
  }

  const contactLine = [
    doc.contact?.location,
    doc.contact?.email,
    doc.contact?.phone,
    doc.contact?.linkedin,
    doc.contact?.github,
    doc.contact?.website,
    ...(doc.contact?.links || []),
  ]
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .join(" • ");

  if (contactLine) {
    parts.push(contactLine);
  }

  // Summary
  if (doc.summary) {
    parts.push(`\nPROFESSIONAL SUMMARY\n${doc.summary.trim()}`);
  }

  // Experience
  if (doc.experience && doc.experience.length > 0) {
    const expText = doc.experience
      .map((exp) => {
        const header = [exp.title, exp.company, exp.location, exp.dates]
          .filter(Boolean)
          .join(" | ");
        const bullets = exp.bullets.map((b) => `• ${b}`).join("\n");
        return `${header}\n${bullets}`;
      })
      .join("\n\n");

    parts.push(`\nPROFESSIONAL EXPERIENCE\n${expText}`);
  }

  // Education
  if (doc.education && doc.education.length > 0) {
    const eduText = doc.education
      .map((edu) => {
        const line = [edu.degree, edu.school, edu.dates].filter(Boolean).join(" | ");
        return edu.details ? `${line}\n${edu.details}` : line;
      })
      .join("\n");

    parts.push(`\nEDUCATION\n${eduText}`);
  }

  // Skills
  if (doc.skills && doc.skills.length > 0) {
    parts.push(`\nTECHNICAL SKILLS\n${doc.skills.join(", ")}`);
  }

  // Projects
  if (doc.projects && doc.projects.length > 0) {
    const projText = doc.projects.map((p) => `${p.name}: ${p.description}`).join("\n");
    parts.push(`\nPROJECTS\n${projText}`);
  }

  // Certifications
  if (doc.certifications && doc.certifications.length > 0) {
    parts.push(`\nCERTIFICATIONS\n${doc.certifications.join("\n")}`);
  }

  return parts.join("\n\n").trim();
}
