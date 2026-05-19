// ─── Resume Analysis ─────────────────────────────────────

export interface RewriteSuggestion {
  section: string;
  before: string;
  after: string;
}

export interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keywords_matched?: string[];
  keywords_missing?: string[];
  suggestions: RewriteSuggestion[];
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

// ─── Stripe ───────────────────────────────────────────────

export interface CheckoutRequest {
  priceId: string;
  mode: "payment" | "subscription";
}
