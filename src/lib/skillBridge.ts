/**
 * skillBridge.ts
 *
 * Maps missing technical keywords to actionable learning pathways:
 * - Top Industry Certification
 * - Free Documentation / Crash Course Tutorial
 * - 1-Weekend Portfolio Project Blueprint
 */

export interface SkillPathway {
  skill: string;
  category: "cloud" | "backend" | "frontend" | "data" | "devops" | "general";
  certification: {
    name: string;
    provider: string;
    badge: string;
  };
  freeTutorial: {
    title: string;
    url: string;
    duration: string;
  };
  portfolioProject: {
    title: string;
    description: string;
    resumeBullet: string;
  };
}

const SKILL_DATABASE: Record<string, SkillPathway> = {
  aws: {
    skill: "AWS",
    category: "cloud",
    certification: {
      name: "AWS Certified Solutions Architect – Associate",
      provider: "Amazon Web Services",
      badge: "SAA-C03",
    },
    freeTutorial: {
      title: "AWS Cloud Technical Essentials",
      url: "https://aws.amazon.com/training/digital/",
      duration: "4 Hours",
    },
    portfolioProject: {
      title: "Serverless Image Processing Pipeline",
      description: "Build an event-driven thumbnail generator using AWS S3, Lambda, and DynamoDB.",
      resumeBullet:
        "Engineered automated serverless image processing pipeline using AWS Lambda & S3, processing 10K+ uploads daily.",
    },
  },
  kubernetes: {
    skill: "Kubernetes",
    category: "devops",
    certification: {
      name: "Certified Kubernetes Administrator (CKA)",
      provider: "Cloud Native Computing Foundation (CNCF)",
      badge: "CKA",
    },
    freeTutorial: {
      title: "Kubernetes by Example & Katacoda Scenarios",
      url: "https://kubernetes.io/docs/tutorials/",
      duration: "3 Hours",
    },
    portfolioProject: {
      title: "Zero-Downtime Microservices Cluster",
      description:
        "Deploy a multi-service Node.js & PostgreSQL stack with Helm charts and automated HPA scaling.",
      resumeBullet:
        "Orchestrated Kubernetes microservices cluster with Horizontal Pod Autoscaling, maintaining 99.95% uptime.",
    },
  },
  typescript: {
    skill: "TypeScript",
    category: "frontend",
    certification: {
      name: "Meta Front-End Developer Professional Certificate",
      provider: "Coursera / Meta",
      badge: "Meta Certified",
    },
    freeTutorial: {
      title: "Total TypeScript Essentials",
      url: "https://www.totaltypescript.com/",
      duration: "2 Hours",
    },
    portfolioProject: {
      title: "End-to-End Type-Safe SaaS Dashboard",
      description:
        "Build a full-stack Next.js 15 app with tRPC, Zod schema validation, and strict null safety.",
      resumeBullet:
        "Migrated 45 legacy JavaScript components to strict TypeScript with Zod schemas, eliminating 90% of runtime type exceptions.",
    },
  },
  graphql: {
    skill: "GraphQL",
    category: "backend",
    certification: {
      name: "Apollo GraphQL Certified Associate",
      provider: "Apollo Odyssey",
      badge: "Apollo Associate",
    },
    freeTutorial: {
      title: "Apollo Odyssey Full-Stack Tutorials",
      url: "https://www.apollographql.com/tutorials/",
      duration: "2.5 Hours",
    },
    portfolioProject: {
      title: "Federated GraphQL Gateway API",
      description:
        "Build a unified GraphQL federation layer over separate REST microservices with Redis query caching.",
      resumeBullet:
        "Designed GraphQL gateway aggregating 4 legacy REST endpoints, reducing client payload sizes by 48%.",
    },
  },
};

export function getSkillPathway(skillName: string): SkillPathway {
  const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (SKILL_DATABASE[normalized]) {
    return SKILL_DATABASE[normalized];
  }

  // Generic fallback pathway
  return {
    skill: skillName,
    category: "general",
    certification: {
      name: `${skillName} Professional Specialist`,
      provider: "Industry Recognized Standard",
      badge: "Verified Specialist",
    },
    freeTutorial: {
      title: `Official ${skillName} Developer Documentation & Quickstart`,
      url: `https://google.com/search?q=${encodeURIComponent(skillName + " documentation tutorial")}`,
      duration: "2-3 Hours",
    },
    portfolioProject: {
      title: `${skillName} Production Implementation`,
      description: `Build a production-grade module integrating ${skillName} with automated testing and CI/CD pipelines.`,
      resumeBullet: `Architected and integrated ${skillName} workflow, improving execution reliability and engineering velocity.`,
    },
  };
}
