/**
 * StructuredResume — the AI-extracted structured representation of a corrected
 * resume, returned alongside correctedText by the fixResume API.
 *
 * Rendering from this structure (instead of regex-parsing plain text) gives
 * perfect section detection, date extraction, and content fidelity.
 */
export interface StructuredContact {
  name: string;
  title?: string; // e.g. "Ingénieur Full-Stack"
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  other_links?: string[];
}

export interface StructuredBullet {
  text: string;
}

export interface StructuredExperienceEntry {
  title: string; // Job title
  company: string; // Company name
  location?: string;
  dates: string; // e.g. "Fév 2025 – Présent"
  bullets: string[];
}

export interface StructuredEducationEntry {
  degree: string;
  school: string;
  location?: string;
  dates?: string;
  details?: string; // GPA, honors, relevant coursework
}

export interface StructuredSkillCategory {
  label: string; // e.g. "Frontend", "Cloud & DevOps"
  skills: string[];
}

export interface StructuredProject {
  name: string;
  dates?: string;
  tech?: string; // Tech stack used
  bullets: string[]; // Description as bullets
}

export interface StructuredCertification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface StructuredSection {
  original_heading: string; // Exact heading as in original (preserves French/English)
  type:
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "certifications"
    | "languages"
    | "awards"
    | "other";
  // Type-specific payloads
  summary_text?: string;
  experience?: StructuredExperienceEntry[];
  education?: StructuredEducationEntry[];
  skill_categories?: StructuredSkillCategory[];
  skills_flat?: string[]; // If not categorized
  projects?: StructuredProject[];
  certifications?: StructuredCertification[];
  languages?: string[]; // e.g. ["Arabe (Langue maternelle)", "Français (B2)"]
  awards?: string[];
  other_text?: string; // Fallback for unknown section types
}

export interface StructuredResume {
  contact: StructuredContact;
  sections: StructuredSection[];
}
