/**
 * JSON-Resume Schema Exporter (jsonresume.org)
 * Converts raw resume text and structured analysis data into the open-source JSON Resume standard.
 */

export interface JsonResumeBasics {
  name: string;
  label?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: {
    city?: string;
    region?: string;
    countryCode?: string;
  };
  profiles?: {
    network: string;
    username: string;
    url: string;
  }[];
}

export interface JsonResumeWork {
  name: string;
  position: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights: string[];
}

export interface JsonResumeEducation {
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
}

export interface JsonResumeSkill {
  name: string;
  level?: string;
  keywords: string[];
}

export interface JsonResumeSchema {
  $schema: string;
  basics: JsonResumeBasics;
  work: JsonResumeWork[];
  education: JsonResumeEducation[];
  skills: JsonResumeSkill[];
}

export function exportToJsonResumeSchema(
  resumeText: string,
  targetRole = "",
  matchedKeywords: string[] = []
): JsonResumeSchema {
  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const candidateName = lines[0] || "Candidate";
  const emailMatch = resumeText.match(/[\w.+-]+@[\w.-]+\.\w{2,}/i);
  const phoneMatch = resumeText.match(/\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/);
  const linkedinMatch = resumeText.match(/(?:linkedin\.com\/in\/)([\w-]+)/i);

  // Extract bullets as work highlights
  const highlights = lines
    .filter((l) => l.startsWith("-") || l.startsWith("•") || l.startsWith("*"))
    .map((l) => l.replace(/^[-•*]\s*/, ""));

  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: candidateName,
      label: targetRole || "Software Engineer",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      summary: lines.slice(1, 4).join(" "),
      profiles: linkedinMatch
        ? [
            {
              network: "LinkedIn",
              username: linkedinMatch[1],
              url: `https://linkedin.com/in/${linkedinMatch[1]}`,
            },
          ]
        : [],
    },
    work: [
      {
        name: "Professional Experience",
        position: targetRole || "Engineer",
        highlights: highlights.slice(0, 10),
      },
    ],
    education: [
      {
        institution: "University",
        studyType: "Bachelor of Science",
        area: "Computer Science",
      },
    ],
    skills: [
      {
        name: "Technical Skills",
        keywords: matchedKeywords.length > 0 ? matchedKeywords : ["React", "TypeScript", "Node.js"],
      },
    ],
  };
}

export function downloadJsonResumeFile(
  resumeText: string,
  targetRole = "",
  matchedKeywords: string[] = []
) {
  const schemaObj = exportToJsonResumeSchema(resumeText, targetRole, matchedKeywords);
  const jsonStr = JSON.stringify(schemaObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-schema-${targetRole ? targetRole.replace(/\s+/g, "-").toLowerCase() : "jsonresume"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
