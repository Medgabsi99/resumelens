/**
 * Automatically fixes technical term capitalization & upgrades weak verbs in resume text.
 */

const TECH_DICTIONARY: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  reactjs: "React",
  nextjs: "Next.js",
  nodejs: "Node.js",
  expressjs: "Express",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mongodb: "MongoDB",
  redis: "Redis",
  aws: "AWS",
  docker: "Docker",
  kubernetes: "Kubernetes",
  graphql: "GraphQL",
  tailwindcss: "TailwindCSS",
  python: "Python",
  django: "Django",
  fastapi: "FastAPI",
  java: "Java",
  springboot: "Spring Boot",
  git: "Git",
  github: "GitHub",
};

const WEAK_VERB_MAP: Record<string, string> = {
  "worked on": "engineered",
  "helped with": "collaborated on",
  "was responsible for": "spearheaded",
  did: "orchestrated",
  made: "architected",
  handled: "executed",
  built: "developed & deployed",
  changed: "transformed",
  used: "leveraged",
};

export function fixTechStackCapitalization(text: string): {
  text: string;
  replacementsCount: number;
} {
  let updated = text;
  let count = 0;

  // Replace tech terms with word-boundary awareness
  for (const [lower, correct] of Object.entries(TECH_DICTIONARY)) {
    const regex = new RegExp(`\\b${lower.replace(".", "\\.")}\\b`, "gi");
    updated = updated.replace(regex, (match) => {
      if (match !== correct) {
        count++;
        return correct;
      }
      return match;
    });
  }

  // Replace weak action verbs
  for (const [weak, strong] of Object.entries(WEAK_VERB_MAP)) {
    const regex = new RegExp(`\\b${weak}\\b`, "gi");
    updated = updated.replace(regex, (match) => {
      count++;
      return match[0] === match[0].toUpperCase()
        ? strong.charAt(0).toUpperCase() + strong.slice(1)
        : strong;
    });
  }

  return { text: updated, replacementsCount: count };
}
