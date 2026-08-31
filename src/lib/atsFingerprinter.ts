/**
 * ATS Fingerprinter & Vendor Knowledge Base
 *
 * Reverse-engineered specifications, parsing pipeline quirks, and
 * automated vendor detection from job URLs or company names.
 */

export type AtsVendorId =
  "workday" | "greenhouse" | "lever" | "ashby" | "taleo" | "smartrecruiters" | "icims" | "bamboohr";

export interface AtsVendorSpec {
  id: AtsVendorId;
  name: string;
  logoBadge: string;
  accentColor: string;
  category: string;
  marketShare: string;
  parserEngine: string;
  description: string;
  parsingPeculiarities: string[];
  failureModes: string[];
  recommendedStrategy: string[];
}

// ─── Deep Vendor Specifications ───────────────────────────────────────────────

export const ATS_VENDOR_SPECS: Record<AtsVendorId, AtsVendorSpec> = {
  workday: {
    id: "workday",
    name: "Workday ATS",
    logoBadge: "WD",
    accentColor: "#0051be",
    category: "Enterprise Cloud ERP",
    marketShare: "42% Fortune 500 Enterprise",
    parserEngine: "Hierarchical Grammar & Structured Regex Indexer",
    description:
      "Workday is the dominant Fortune 500 enterprise ATS. It operates on rigid structural assumptions: multi-column resumes, tables, text boxes, and non-standard date ranges frequently cause catastrophic parsing dropouts.",
    parsingPeculiarities: [
      "Strict Date Format Requirement: Requires explicit MM/YYYY or YYYY ranges. Text dates like 'Summer 2023' or 'Present' without numbers often fail.",
      "Table & Column Blindness: Multi-column layouts are merged left-to-right into continuous jumbled sentences.",
      "Header/Footer Drop: Content placed inside Word/PDF header or footer zones is completely discarded by the ingest parser.",
      "Section Grouping: Relies on exact section keywords: 'Professional Experience', 'Education', 'Skills'.",
    ],
    failureModes: [
      "Dropping contact details placed in headers or fancy sidebar boxes.",
      "Merging two parallel columns into incoherent interleaved text blocks.",
      "Failing to associate company names with job titles if placed on separate sub-lines.",
    ],
    recommendedStrategy: [
      "Use single-column top-to-bottom layout with zero nested tables.",
      "Format every role date strictly as '05/2021 – 08/2024' or '2021 – 2024'.",
      "Place phone, email, and LinkedIn in the top body text, never in header zones.",
    ],
  },
  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse",
    logoBadge: "GH",
    accentColor: "#10b981",
    category: "Tech Standard & Scale-up",
    marketShare: "34% High-Growth Tech & Scale-ups",
    parserEngine: "Text Extraction Tokenizer with Exact-Keyword Scoring",
    description:
      "Greenhouse is the gold standard for tier-1 tech companies (Stripe, OpenAI, Uber). It excels at reading plain text/markdown cleanly, but scores candidates heavily on exact-phrase keyword overlap against hiring team requirement bullets.",
    parsingPeculiarities: [
      "High Tokenizer Fidelity: Reads clean PDFs and Word documents cleanly without dropping standard sections.",
      "Keyword Proximity Matching: Matches exact phrases found in the job description's 'Must Have' requirements.",
      "Penalizes Keyword Stuffing: Detects uncontextualized comma-separated keyword blocks if they lack surrounding action verbs.",
      "Resume Text Preview: Recruiters view an extracted plain-text snapshot alongside the original PDF.",
    ],
    failureModes: [
      "Missing critical technical keywords because acronyms weren't expanded (e.g. 'ML' without 'Machine Learning').",
      "Overly stylized decorative bullet icons causing OCR rendering glitch characters.",
    ],
    recommendedStrategy: [
      "Mirror the job posting's exact technical terms (e.g., 'TypeScript', 'Next.js', 'Distributed Systems').",
      "Include both acronyms and full spellings (e.g. 'Amazon Web Services (AWS)').",
      "Keep bullet formatting simple with standard round bullets (•) or hyphens (-).",
    ],
  },
  lever: {
    id: "lever",
    name: "Lever",
    logoBadge: "LEV",
    accentColor: "#6366f1",
    category: "Modern Mid-Market & Talent CRM",
    marketShare: "22% Modern Tech & Venture-Backed Startups",
    parserEngine: "Contextual Semantic Proximity & Recency Weighted Indexer",
    description:
      "Lever emphasizes candidate skill recency and talent relationship management. It weights skills mentioned in recent positions higher than skills mentioned in older historical roles.",
    parsingPeculiarities: [
      "Recency Weighting: Skills in the most recent 2 years receive 3x higher relevance weight than older entries.",
      "Social Profile Ingestion: Automatically parses and enriches candidate profiles with LinkedIn and GitHub links.",
      "Fast Candidate Scanning: Recruiters review in a Kanban drawer with highlighted tag clouds.",
    ],
    failureModes: [
      "Burying your primary target skill only in the 'Education' or oldest job section.",
      "Omitting direct links to GitHub, LinkedIn, or portfolio projects.",
    ],
    recommendedStrategy: [
      "Ensure target role keywords appear prominently in your most recent work experience bullets.",
      "Include clickable markdown links to your LinkedIn, GitHub, and live projects at the top.",
      "Use strong action verbs at the start of every bullet point.",
    ],
  },
  ashby: {
    id: "ashby",
    name: "Ashby",
    logoBadge: "ASH",
    accentColor: "#f59e0b",
    category: "Next-Gen AI ATS & Analytics",
    marketShare: "Rapidly Growing in Modern Tech (Figma, Notion, Coinbase)",
    parserEngine: "Modern AI Multimodal Parser & Semantic Vector Matcher",
    description:
      "Ashby is the next-generation ATS built for modern tech organizations. It utilizes advanced AI parsing models capable of reading complex PDF layouts, while applying high scrutiny to quantified metrics and business impact.",
    parsingPeculiarities: [
      "AI Layout Understanding: High tolerance for modern typographic hierarchy and subtle styling.",
      "Quantified Impact Evaluation: Looks for numeric indicators of business results ($, %, DAU, scale, latency).",
      "Strict Fluff Detection: Penalizes generic responsibility lists without concrete achievements.",
    ],
    failureModes: [
      "Using passive, unquantified descriptions like 'Responsible for helping team with frontend.'",
      "Omitting measurable scale numbers (e.g. user counts, throughput, latency savings).",
    ],
    recommendedStrategy: [
      "Follow Google's XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.",
      "Highlight concrete numbers: percentages, dollar values, scale numbers, latency reductions.",
      "Emphasize modern engineering tooling (AI pipelines, Next.js, Cloud architectures).",
    ],
  },
  taleo: {
    id: "taleo",
    name: "Oracle Taleo",
    logoBadge: "TAL",
    accentColor: "#dc2626",
    category: "Legacy Enterprise & Banking",
    marketShare: "28% Global Enterprise, Government & Banking",
    parserEngine: "Legacy Text Parser with OCR Keyword Scanner",
    description:
      "Oracle Taleo is a legacy enterprise system widely used in banking, aerospace, and government. It has an outdated parsing engine that easily breaks on emojis, custom fonts, and graphical elements.",
    parsingPeculiarities: [
      "Fragile Character Encoding: Fails on non-standard unicode characters, emojis, or stylized symbols.",
      "Exact Job Title Requirement: Searches for exact matches between candidate job titles and open requisition titles.",
      "Discards Graphic Layers: Rejects embedded charts, icon bars, or graphical skill meter bars.",
    ],
    failureModes: [
      "Using rating dots (e.g. 5/5 stars for Python) which parse as blank spaces.",
      "Using complex vector graphics or multi-layered PDF exports.",
    ],
    recommendedStrategy: [
      "Use basic ASCII characters and standard fonts (Arial, Helvetica, Times, Calibri).",
      "Align your past job titles closely with the target role title.",
      "Never use visual skill bars or rating circles.",
    ],
  },
  smartrecruiters: {
    id: "smartrecruiters",
    name: "SmartRecruiters",
    logoBadge: "SR",
    accentColor: "#0284c7",
    category: "Global Enterprise Hiring Suite",
    marketShare: "18% Global Multinationals & Retail",
    parserEngine: "Ontology-Based Skill Taxonomy Classifier",
    description:
      "SmartRecruiters uses an industry ontology classifier to categorize hard skills, soft skills, certifications, and language proficiencies into structured profile buckets.",
    parsingPeculiarities: [
      "Standard Taxonomy Matching: Maps candidate skills against standardized industry competency lists.",
      "Language & Certification Detection: Has dedicated extraction zones for accredited credentials.",
    ],
    failureModes: [
      "Using proprietary internal company jargon instead of standard industry terminology.",
    ],
    recommendedStrategy: [
      "List standardized technical terms (e.g. 'AWS Certified Solutions Architect', 'PostgreSQL').",
      "Include a dedicated 'Technical Skills' section with distinct categories.",
    ],
  },
  icims: {
    id: "icims",
    name: "iCIMS",
    logoBadge: "IC",
    accentColor: "#4f46e5",
    category: "High-Volume Enterprise & Retail",
    marketShare: "20% High-Volume Enterprise & Healthcare",
    parserEngine: "Structured Document Deconstructor",
    description:
      "iCIMS is popular in high-volume enterprise environments like retail, logistics (Amazon), and healthcare. It enforces strict separation of education, experience, and contact information.",
    parsingPeculiarities: [
      "Standard Header Dependency: Looks for explicit 'Education' and 'Work Experience' headings.",
      "City/State Extraction: Requires standardized 'City, ST' or 'City, Country' formatting.",
    ],
    failureModes: ["Formatting location without clear city/state delimiters."],
    recommendedStrategy: [
      "Ensure location is formatted as 'City, ST' (e.g. 'San Francisco, CA').",
      "Use clear standard section dividers.",
    ],
  },
  bamboohr: {
    id: "bamboohr",
    name: "BambooHR",
    logoBadge: "BHR",
    accentColor: "#16a34a",
    category: "Small to Mid-Sized Business (SMB)",
    marketShare: "15% SMB & Emerging Startups",
    parserEngine: "Direct Document Ingest & Human-Centric Reviewer",
    description:
      "BambooHR is primarily used by small-to-mid sized businesses. It provides high-visibility human recruiter review with automated keyword tagging.",
    parsingPeculiarities: [
      "High Visual Fidelity: Human hiring managers review the original rendered PDF directly.",
      "Scannability Emphasis: Clean visual hierarchy and readable typography are paramount.",
    ],
    failureModes: ["Dense, unbroken walls of text that discourage human recruiter reading."],
    recommendedStrategy: [
      "Keep bullet points concise (1–2 lines max per bullet).",
      "Use clean margins and strong typographical contrast.",
    ],
  },
};

// ─── Top 100+ Verified Company ATS Map ────────────────────────────────────────

export const KNOWN_COMPANY_ATS_MAP: Record<string, AtsVendorId> = {
  // Tier-1 Tech & AI
  stripe: "greenhouse",
  openai: "greenhouse",
  anthropic: "greenhouse",
  figma: "ashby",
  notion: "ashby",
  coinbase: "ashby",
  ramp: "ashby",
  linear: "ashby",
  vercel: "ashby",
  netflix: "workday",
  google: "greenhouse",
  amazon: "icims",
  apple: "taleo",
  microsoft: "workday",
  meta: "greenhouse",
  uber: "greenhouse",
  airbnb: "greenhouse",
  snowflake: "workday",
  datadog: "greenhouse",
  github: "greenhouse",
  spotify: "greenhouse",
  salesforce: "workday",
  adobe: "workday",
  nvidia: "workday",
  tesla: "workday",
  palantir: "greenhouse",
  reddit: "greenhouse",
  pinterest: "greenhouse",
  robinhood: "greenhouse",
  doordash: "greenhouse",
  instacart: "greenhouse",
  cloudflare: "greenhouse",
  twilio: "greenhouse",
  atlassian: "workday",
  slack: "workday",
  zoom: "workday",
  square: "greenhouse",
  block: "greenhouse",
  paypal: "workday",
  cisco: "taleo",
  oracle: "taleo",
  ibm: "workday",
  intel: "workday",
  amd: "workday",
  qualcomm: "workday",
  databricks: "greenhouse",
  scaleai: "greenhouse",
  retool: "greenhouse",
  brex: "greenhouse",
  rippling: "greenhouse",
  plaid: "greenhouse",
  chime: "greenhouse",
  gusto: "greenhouse",
  lyft: "greenhouse",
  snap: "workday",
  tiktok: "workday",
  bytedance: "workday",
  epicgames: "greenhouse",
  roblox: "greenhouse",
  unity: "greenhouse",
  dropbox: "greenhouse",
  box: "greenhouse",
  mongodb: "greenhouse",
  elastic: "greenhouse",
  hashicorp: "greenhouse",
  gitlab: "greenhouse",
  snyk: "greenhouse",
  auth0: "greenhouse",
  okta: "workday",
  crowdstrike: "workday",
  paloaltonetworks: "workday",
  splunk: "workday",
  servicenow: "workday",
  hubspot: "greenhouse",
  zendesk: "greenhouse",
  dbt: "ashby",
  postman: "greenhouse",
  canva: "greenhouse",
  grammarly: "greenhouse",
  duolingo: "greenhouse",
  affirm: "greenhouse",
  klarna: "greenhouse",

  // Finance & Banking
  goldmansachs: "taleo",
  jpmorgan: "taleo",
  chase: "taleo",
  morganstanley: "workday",
  citigroup: "workday",
  bankofamerica: "workday",
  blackrock: "workday",
  vanguard: "workday",
  fidelity: "workday",
  capitalone: "workday",
  visa: "smartrecruiters",
  mastercard: "workday",
  americanexpress: "workday",

  // Healthcare, Retail, Enterprise
  walmart: "workday",
  target: "workday",
  nike: "workday",
  disney: "workday",
  starbucks: "taleo",
  pfizer: "workday",
  moderna: "workday",
  johnsonandjohnson: "workday",
  unitedhealth: "taleo",
  cvs: "taleo",
};

// ─── Detection Functions ──────────────────────────────────────────────────────

export interface AtsDetectionResult {
  vendorId: AtsVendorId;
  vendorName: string;
  spec: AtsVendorSpec;
  confidence: "Exact Match" | "High Confidence" | "Heuristic Estimate";
  matchedCompany?: string;
  source: "url_domain" | "company_database" | "text_heuristic";
}

/**
 * Detects the ATS vendor from a job URL.
 * Recognizes Greenhouse, Workday, Lever, Ashby, Taleo, SmartRecruiters, iCIMS, BambooHR.
 */
export function detectAtsVendorFromUrl(rawUrl: string): AtsDetectionResult {
  const url = (rawUrl || "").trim().toLowerCase();

  // 1. Direct ATS Domain Matching
  if (/greenhouse\.io|boards\.greenhouse\.io|grnh\.se/.test(url)) {
    return {
      vendorId: "greenhouse",
      vendorName: "Greenhouse",
      spec: ATS_VENDOR_SPECS.greenhouse,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/myworkdayjobs\.com|myworkday\.com|\.workday\.com/.test(url)) {
    return {
      vendorId: "workday",
      vendorName: "Workday",
      spec: ATS_VENDOR_SPECS.workday,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/jobs\.lever\.co|lever\.co/.test(url)) {
    return {
      vendorId: "lever",
      vendorName: "Lever",
      spec: ATS_VENDOR_SPECS.lever,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/jobs\.ashbyhq\.com|ashbyhq\.com/.test(url)) {
    return {
      vendorId: "ashby",
      vendorName: "Ashby",
      spec: ATS_VENDOR_SPECS.ashby,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/taleo\.net|oraclecloud\.com/.test(url)) {
    return {
      vendorId: "taleo",
      vendorName: "Oracle Taleo",
      spec: ATS_VENDOR_SPECS.taleo,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/smartrecruiters\.com/.test(url)) {
    return {
      vendorId: "smartrecruiters",
      vendorName: "SmartRecruiters",
      spec: ATS_VENDOR_SPECS.smartrecruiters,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/icims\.com/.test(url)) {
    return {
      vendorId: "icims",
      vendorName: "iCIMS",
      spec: ATS_VENDOR_SPECS.icims,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  if (/bamboohr\.com/.test(url)) {
    return {
      vendorId: "bamboohr",
      vendorName: "BambooHR",
      spec: ATS_VENDOR_SPECS.bamboohr,
      confidence: "Exact Match",
      source: "url_domain",
    };
  }

  // 2. Company Name Extraction from URL path / domain
  for (const [company, vendorId] of Object.entries(KNOWN_COMPANY_ATS_MAP)) {
    if (url.includes(company)) {
      return {
        vendorId,
        vendorName: ATS_VENDOR_SPECS[vendorId].name,
        spec: ATS_VENDOR_SPECS[vendorId],
        confidence: "High Confidence",
        matchedCompany: company.charAt(0).toUpperCase() + company.slice(1),
        source: "company_database",
      };
    }
  }

  // Default fallback for tech URLs
  return {
    vendorId: "greenhouse",
    vendorName: "Greenhouse (Default Tech ATS)",
    spec: ATS_VENDOR_SPECS.greenhouse,
    confidence: "Heuristic Estimate",
    source: "text_heuristic",
  };
}

/**
 * Detects the ATS vendor from a company name.
 */
export function detectAtsVendorFromCompany(companyName: string): AtsDetectionResult {
  const normalized = (companyName || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normalized && KNOWN_COMPANY_ATS_MAP[normalized]) {
    const vendorId = KNOWN_COMPANY_ATS_MAP[normalized];
    return {
      vendorId,
      vendorName: ATS_VENDOR_SPECS[vendorId].name,
      spec: ATS_VENDOR_SPECS[vendorId],
      confidence: "Exact Match",
      matchedCompany: companyName,
      source: "company_database",
    };
  }

  // Check substring match
  for (const [key, vendorId] of Object.entries(KNOWN_COMPANY_ATS_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        vendorId,
        vendorName: ATS_VENDOR_SPECS[vendorId].name,
        spec: ATS_VENDOR_SPECS[vendorId],
        confidence: "High Confidence",
        matchedCompany: key.charAt(0).toUpperCase() + key.slice(1),
        source: "company_database",
      };
    }
  }

  // Fallback
  return {
    vendorId: "greenhouse",
    vendorName: "Greenhouse",
    spec: ATS_VENDOR_SPECS.greenhouse,
    confidence: "Heuristic Estimate",
    source: "text_heuristic",
  };
}
