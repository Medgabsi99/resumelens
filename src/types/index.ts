// ─── Resume Analysis ─────────────────────────────────────

export interface RewriteSuggestion {
  section: string;
  before: string;
  after: string;
}

export interface AtsBreakdown {
  format: number;      // 1-100 — ATS-friendly formatting, no tables/columns/headers-footers
  keywords: number;    // 1-100 — keyword match rate against job description (0 if no JD)
  impact: number;      // 1-100 — action verbs, quantified achievements, results
  readability: number; // 1-100 — length, whitespace, clear section headings, scannability
}

export interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keywords_matched?: string[];
  keywords_missing?: string[];
  suggestions: RewriteSuggestion[];
  ats_breakdown?: AtsBreakdown;
}

// ─── API Request/Response ─────────────────────────────────

export interface AnalyzeRequest {
  resumeText: string;
  jobDescription?: string;
  targetRole?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  extractedText?: string;
  error?: string;
  // Partial data returned on free tier
  preview?: {
    score: number;
    summary: string;
    strengths: string[];
  };
  requiresUpgrade?: boolean;
}

// ─── User / Subscription ──────────────────────────────────

export type PlanType = "free" | "one_time" | "monthly";

export interface UserProfile {
  id: string;
  email: string;
  plan: PlanType;
  analyses_used: number;
  analyses_limit: number;
  stripe_customer_id?: string;
  created_at: string;
}

// ─── Resume Library ────────────────────────────────────────

export interface SavedResume {
  id: string;
  user_id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  resume_text: string;
  job_description: string | null;
  last_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface SaveResumeRequest {
  name: string;
  resumeText: string;
  targetRole?: string;
  targetCompany?: string;
  jobDescription?: string;
  lastScore?: number;
}

// ─── Stripe ───────────────────────────────────────────────

export interface CheckoutRequest {
  priceId: string;
  mode: "payment" | "subscription";
}

// ─── Application Tracker ──────────────────────────────────

export type ApplicationStatus =
  | "saved"        // saved but not applied
  | "applied"      // submitted application
  | "screening"    // phone/recruiter screen
  | "interviewing" // in interview process
  | "offer"        // received offer
  | "rejected"     // rejected
  | "withdrawn"    // withdrew application
  | "accepted";    // accepted offer

export type Priority = "low" | "medium" | "high";

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url?: string | null;
  job_description?: string | null;
  status: ApplicationStatus;
  priority: Priority;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  applied_at?: string | null;
  deadline_at?: string | null;
  follow_up_at?: string | null;
  notes?: string | null;
  resume_id?: string | null;
  match_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  jobDescription?: string;
  status?: ApplicationStatus;
  priority?: Priority;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  contactName?: string;
  contactEmail?: string;
  appliedAt?: string;
  deadlineAt?: string;
  followUpAt?: string;
  notes?: string;
  resumeId?: string;
  matchScore?: number;
}

export interface UpdateApplicationRequest extends Partial<CreateApplicationRequest> {
  status?: ApplicationStatus;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  accepted: "Accepted",
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  saved: { bg: "#f1f5f9", text: "#475569" },
  applied: { bg: "#dbeafe", text: "#1c5878" },
  screening: { bg: "#e0e7ff", text: "#3730a3" },
  interviewing: { bg: "#fef3c7", text: "#854d0e" },
  offer: { bg: "#d1fae5", text: "#065f46" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  withdrawn: { bg: "#f3e8ff", text: "#6b21a8" },
  accepted: { bg: "#a7f3d0", text: "#064e3b" },
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#64748b",
  medium: "#f59e0b",
  high: "#ef4444",
};

// ─── Job Match ─────────────────────────────────────────────


export interface JobMatchBreakdown {
  skills: number;        // 1-100 — required skills match
  experience: number;    // 1-100 — relevant experience level
  education: number;     // 1-100 — education requirements
  responsibilities: number; // 1-100 — past responsibilities alignment
  culture: number;       // 1-100 — culture/values fit
}

export interface JobMatchResult {
  overallScore: number;          // 0-100 weighted average
  fitVerdict: "strong" | "good" | "fair" | "weak";
  summary: string;
  strengths: string[];            // Why you're a good fit
  gaps: string[];                 // What's missing
  matchedSkills: string[];       // Skills you have that they want
  missingSkills: string[];        // Skills they want that you lack
  matchedKeywords: string[];      // Important JD keywords present
  missingKeywords: string[];      // Important JD keywords absent
  experienceMatch: {
    required: string;             // What they ask for (e.g. "5+ years")
    yours: string;                // What you have
    verdict: "exceeds" | "meets" | "slightly-below" | "below";
  };
  topRecommendations: string[];   // 3-5 specific things to improve match
  breakdown: JobMatchBreakdown;
}

export interface JobMatchRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

// ─── Smart Resume Generator ────────────────────────────────

export interface SmartResumeRequest {
  resumeText: string;
  targetRole?: string;
  jobDescription?: string;
}

export interface SmartResumeResponse {
  success: boolean;
  parsedResume?: import("@/lib/parseResume").ParsedResume;
  recommendedTemplate?: string;
  enhancedText?: string;
  error?: string;
}

// ─── Hiring Committee Debrief ────────────────────────────────

export interface DebriefMessage {
  speaker: "HR Recruiter" | "Engineering Manager" | "Product Manager";
  message: string;
}

export interface CommitteeDebriefResult {
  overallRecommendation: "Hire" | "No Hire" | "Strong Hire" | "Leaning No Hire";
  hrScore: number;
  techScore: number;
  productScore: number;
  debriefTranscript: DebriefMessage[];
  strengthsDebated: string[];
  weaknessesDebated: string[];
  recommendedRemedies: string[];
  isCommittee: true;
}
