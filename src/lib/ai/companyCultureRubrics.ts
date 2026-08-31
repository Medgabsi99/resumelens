/**
 * companyCultureRubrics.ts
 *
 * Reverse-engineered hiring criteria and cultural principles for Tier-1 FAANG
 * and high-growth scale-ups (Google, Amazon, Stripe, Apple, Meta, OpenAI).
 */

export type TargetCompanyId = "google" | "amazon" | "stripe" | "apple" | "meta" | "openai";

export interface CompanyRubric {
  id: TargetCompanyId;
  name: string;
  badgeColor: string;
  tagline: string;
  corePrinciples: string[];
  whatTheyLookFor: string;
  commonResumeRejectionReason: string;
  sampleCultureRewrite: {
    before: string;
    after: string;
    principleApplied: string;
  };
}

export const COMPANY_RUBRICS: Record<TargetCompanyId, CompanyRubric> = {
  google: {
    id: "google",
    name: "Google / Alphabet",
    badgeColor: "#4285f4",
    tagline: "Large-Scale Distributed Systems & Complexity",
    corePrinciples: [
      "Googliness & Navigation of Ambiguity",
      "System Scale & Reliability",
      "Data-Driven Engineering Decisions",
    ],
    whatTheyLookFor:
      "Demonstrated ability to write clean, maintainable code for millions of concurrent users with deep technical nuance.",
    commonResumeRejectionReason:
      "Listing superficial tools without explaining architectural trade-offs, algorithms, or distributed system constraints.",
    sampleCultureRewrite: {
      before: "Built an internal API for the marketing team to fetch customer data.",
      after:
        "Architected distributed gRPC microservice processing 45M daily queries with sub-12ms p99 latency across multi-region Kubernetes clusters.",
      principleApplied: "Googliness & Distributed Scale",
    },
  },
  amazon: {
    id: "amazon",
    name: "Amazon / AWS",
    badgeColor: "#ff9900",
    tagline: "16 Leadership Principles & Customer Obsession",
    corePrinciples: [
      "Customer Obsession",
      "Ownership & Bias for Action",
      "Frugality & Delivering Results",
    ],
    whatTheyLookFor:
      "Obsessive ownership, relentless bias for action, and measurable dollar/time savings directly benefiting end customers.",
    commonResumeRejectionReason:
      "Passive descriptions using 'we assisted' without personal ownership and crisp metric outcomes.",
    sampleCultureRewrite: {
      before: "Helped optimize AWS cloud infrastructure costs for the platform.",
      after:
        "Spearheaded cloud resource right-sizing across 120 EC2 instances, eliminating $240K in annual compute waste with zero customer downtime.",
      principleApplied: "Ownership & Frugality",
    },
  },
  stripe: {
    id: "stripe",
    name: "Stripe",
    badgeColor: "#635bff",
    tagline: "High Craft, Written Clarity & Velocity",
    corePrinciples: [
      "Macro Curiosity & Micro Craft",
      "Operating with Urgency",
      "Global GDP Expansion",
    ],
    whatTheyLookFor:
      "Meticulous attention to detail, extraordinary written documentation, and building APIs that feel delightful to other developers.",
    commonResumeRejectionReason:
      "Cluttered, poorly formatted bullets with sloppy typography or generic developer jargon.",
    sampleCultureRewrite: {
      before: "Created developer documentation and endpoints for payments.",
      after:
        "Authored developer-first REST API contracts and SDKs adopted by 1,200+ external partners, maintaining 99.999% uptime SLAs.",
      principleApplied: "High Craft & API Excellence",
    },
  },
  apple: {
    id: "apple",
    name: "Apple",
    badgeColor: "#a3aaae",
    tagline: "Design Perfection & Hardware-Software Symbiosis",
    corePrinciples: [
      "Simplicity & Aesthetic Precision",
      "Zero-Compromise Privacy",
      "Deep Platform Integration",
    ],
    whatTheyLookFor:
      "Obsession with butter-smooth 120fps interactions, battery/memory efficiency, and seamless user experiences.",
    commonResumeRejectionReason:
      "Focusing purely on backend brute-force without respecting user experience, framerates, or memory footprints.",
    sampleCultureRewrite: {
      before: "Worked on frontend user interface and animations.",
      after:
        "Engineered 120 FPS fluid canvas UI utilizing WebGL shaders and zero-allocation memory buffers, reducing battery consumption by 22%.",
      principleApplied: "Aesthetic Precision & Zero Compromise",
    },
  },
  meta: {
    id: "meta",
    name: "Meta",
    badgeColor: "#0668e1",
    tagline: "Move Fast & Maximize Raw Business Impact",
    corePrinciples: [
      "Move Fast & Build Awesome Things",
      "Focus on High-Leverage Impact",
      "Live in the Future",
    ],
    whatTheyLookFor:
      "Engineers who cut through red tape, launch iterative experiments rapidly, and move key business metrics (DAU, engagement, revenue).",
    commonResumeRejectionReason:
      "Projects that took 12 months with no tangible production deployment or quantifiable user adoption.",
    sampleCultureRewrite: {
      before: "Tested several landing page variations for user growth.",
      after:
        "Conducted 18 rapid A/B experiments across 2M users, driving a +14.2% lift in organic signup conversion in Q3.",
      principleApplied: "Move Fast & Raw Metric Impact",
    },
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    badgeColor: "#10a37f",
    tagline: "Frontier AI Safety & Infrastructure Scalability",
    corePrinciples: [
      "Broadly Beneficial AGI",
      "Technical Rigor & Scaling Laws",
      "Long-Term Alignment",
    ],
    whatTheyLookFor:
      "Deep mathematical/algorithmic intuition, handling massive GPU tensor workloads, and thoughtful AI alignment considerations.",
    commonResumeRejectionReason:
      "Simple wrapper apps without deep knowledge of inference latency, tokenization, or vector retrieval pipelines.",
    sampleCultureRewrite: {
      before: "Integrated OpenAI API for customer support chatbot.",
      after:
        "Engineered low-latency RAG pipeline with hybrid semantic vector search and dynamic context caching, reducing token expenditure by 42%.",
      principleApplied: "Frontier Rigor & Token Efficiency",
    },
  },
};

export function evaluateCompanyFit(
  resumeText: string,
  companyId: TargetCompanyId
): {
  score: number;
  matchedPrinciples: string[];
  missingPrinciples: string[];
  rubric: CompanyRubric;
} {
  const rubric = COMPANY_RUBRICS[companyId] || COMPANY_RUBRICS.google;
  const lower = (resumeText || "").toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  rubric.corePrinciples.forEach((principle) => {
    const keywords = principle.toLowerCase().split(/\s+/);
    const hasMatch = keywords.some((kw) => kw.length > 3 && lower.includes(kw));
    if (hasMatch) {
      matched.push(principle);
    } else {
      missing.push(principle);
    }
  });

  const baseScore = Math.min(96, Math.max(68, 70 + matched.length * 8));

  return {
    score: baseScore,
    matchedPrinciples: matched,
    missingPrinciples: missing,
    rubric,
  };
}
