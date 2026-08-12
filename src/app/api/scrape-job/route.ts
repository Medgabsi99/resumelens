import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export const maxDuration = 30;

/**
 * Scrapes a job posting URL and extracts clean job description text.
 * Supports: LinkedIn (via Guest API & container extraction), Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, and generic web pages.
 */
export async function POST(req: NextRequest) {
  // Optional authentication check — don't block guests on the homepage
  const session = await getServerSession();
  if (session?.user?.id) {
    const rateLimit = await checkRateLimit(session.user.id, "job-scrape");
    if (!rateLimit.success) return rateLimitResponse();
  }

  let url: string;
  try {
    const body = await req.json();
    url = body.url?.trim();
    if (!url) throw new Error("Missing URL");
    // Validate URL structure
    new URL(url);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid or missing URL" }, { status: 400 });
  }

  // Block localhost / private IPs
  const hostname = new URL(url).hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local")
  ) {
    return NextResponse.json(
      { success: false, error: "Private URLs are not allowed" },
      { status: 400 }
    );
  }

  try {
    let text: string | null = null;

    // ── Stage 1: Site-Specific Public Guest API (LinkedIn / Indeed) ──────
    if (hostname.includes("linkedin.com")) {
      text = await fetchLinkedInJob(url);
    } else if (hostname.includes("indeed.com")) {
      text = await fetchIndeedJob(url);
    }

    // ── Stage 2: Direct HTTP Fetch with realistic browser headers ────────
    if (!text || text.length < 100 || isAuthWall(text)) {
      text = await fetchDirect(url);
    }

    // ── Stage 3: Jina Reader Fallback (handles JS rendering & CAPTCHAs) ──
    if (!text || text.length < 100 || isAuthWall(text)) {
      text = await fetchViaJinaReader(url);
    }

    if (!text || text.length < 80 || isAuthWall(text)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract job description from this URL due to website sign-in restrictions. Try copying and pasting the job text manually.",
        },
        { status: 422 }
      );
    }

    // Truncate to 10k chars to stay within AI context limits
    const trimmed = text.slice(0, 10000);

    return NextResponse.json({ success: true, jobDescription: trimmed, charCount: trimmed.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch URL";
    logger.error("[job-scrape]", msg);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load that URL. The site may block automated access — try copying the job text manually.",
      },
      { status: 500 }
    );
  }
}

/**
 * Special Handler: LinkedIn Guest API
 * Fetches https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{jobId} directly
 * and extracts the .show-more-less-html__markup description container.
 */
async function fetchLinkedInJob(url: string): Promise<string | null> {
  try {
    const jobIdMatch = url.match(/currentJobId=(\d+)|jobs\/view\/(\d+)|jobs\/(\d+)/i);
    const jobId = jobIdMatch ? jobIdMatch[1] || jobIdMatch[2] || jobIdMatch[3] : null;

    if (!jobId) return null;

    const guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
    const response = await fetch(guestApiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Target the exact LinkedIn description container
    const match =
      html.match(/class=["'][^"']*show-more-less-html__markup[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/class=["'][^"']*description__text[^"']*["'][^>]*>([\s\S]*?)<\/section>/i) ||
      html.match(/<section[^>]*class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/section>/i);

    if (match && match[1]) {
      const text = cleanHtmlText(match[1]);
      if (text.length >= 100 && !isAuthWall(text)) {
        return text;
      }
    }

    // Fallback: try JSON-LD in Guest API response
    const jsonLd = extractFromJSONLD(html);
    if (jsonLd && jsonLd.length >= 100 && !isAuthWall(jsonLd)) {
      return jsonLd;
    }
  } catch {
    // Ignore and let main pipeline attempt fallbacks
  }
  return null;
}

/**
 * Special Handler: Indeed Job
 */
async function fetchIndeedJob(url: string): Promise<string | null> {
  try {
    const jkMatch = url.match(/[?&]jk=([a-f0-9]+)/i);
    if (!jkMatch) return null;

    const embeddedUrl = `https://www.indeed.com/viewjob?jk=${jkMatch[1]}&viewtype=embedded`;
    const response = await fetch(embeddedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const text = extractJobText(html, url);
    if (text && text.length >= 100 && !isAuthWall(text)) {
      return text;
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * Direct HTTP Fetch & Multi-Stage Extraction
 */
async function fetchDirect(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    return extractJobText(html, url);
  } catch {
    return null;
  }
}

/**
 * Fallback via Jina AI Reader (handles JS rendering & anti-bot walls)
 */
async function fetchViaJinaReader(targetUrl: string): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const response = await fetch(jinaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResumeLens/1.0)",
        Accept: "text/plain, text/markdown",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    let text = await response.text();
    // Strip Jina headers/footers if present
    text = text.replace(/^Title:[\s\S]*?Markdown Content:\n/i, "").trim();
    if (text.length >= 80 && !isAuthWall(text)) return text;
  } catch {
    // Ignore Jina failure
  }
  return null;
}

/**
 * Detects if extracted text is actually an Auth Wall, sign-in prompt, or cookie consent banner
 */
function isAuthWall(text: string): boolean {
  const lower = text.toLowerCase();
  const authPhrases = [
    "agree to linkedin",
    "sign in instantly to your linkedin",
    "one-time link to your primary email",
    "check your spam folder",
    "user agreement , privacy policy",
    "sign in to view full job",
    "create an account or log in to",
    "please enable javascript to view",
    "access denied - cloudflare",
  ];
  return authPhrases.some((phrase) => lower.includes(phrase));
}

/**
 * Multi-Stage Extractor
 */
function extractJobText(html: string, url: string): string {
  // Stage 1: JSON-LD Schema.org JobPosting
  const jsonLdDesc = extractFromJSONLD(html);
  if (jsonLdDesc && jsonLdDesc.length >= 100 && !isAuthWall(jsonLdDesc)) {
    return jsonLdDesc;
  }

  // Stage 2: HTML Container Selectors & Site-Specific RegEx
  const containerDesc = extractFromContainers(html, url);
  if (containerDesc && containerDesc.length >= 100 && !isAuthWall(containerDesc)) {
    return containerDesc;
  }

  // Stage 3: Meta Tag OpenGraph Description
  const metaDesc = extractFromMetaTags(html);
  if (metaDesc && metaDesc.length >= 100 && !isAuthWall(metaDesc)) {
    return metaDesc;
  }

  // Stage 4: Heuristic Clean Fallback
  return extractDensestBlock(html);
}

/**
 * Stage 1: Extracts structured JobPosting JSON-LD
 */
function extractFromJSONLD(html: string): string | null {
  const matches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"] === "JobPosting" || item["type"] === "JobPosting") {
          let desc = item.description || "";
          if (typeof desc === "string" && desc.length > 50) {
            return cleanHtmlText(desc);
          }
        }
      }
    } catch {
      // Continue searching
    }
  }
  return null;
}

/**
 * Stage 2: Container-based extraction
 */
function extractFromContainers(html: string, url: string): string | null {
  const hostname = new URL(url).hostname.toLowerCase();

  const selectors = [
    // Indeed
    /id=["']jobDescriptionText["'][^>]*>([\s\S]*?)<\/div>/i,
    // LinkedIn
    /class=["'][^"']*show-more-less-html__markup[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /id=["']job-details["'][^>]*>([\s\S]*?)<\/section>/i,
    // Greenhouse
    /id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
    // Lever
    /class=["'][^"']*section page-centered[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    // Generic job-description containers
    /class=["'][^"']*(?:job-description|description|posting-description|jobDetails)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /id=["'][^"']*(?:job-description|description|posting-description|jobDetails)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const regex of selectors) {
    const match = html.match(regex);
    if (match && match[1]) {
      const text = cleanHtmlText(match[1]);
      if (text.length >= 100 && !isAuthWall(text)) return text;
    }
  }

  // Site-specific text marker bounds fallback
  const cleaned = cleanHtmlText(html);
  if (hostname.includes("linkedin.com")) {
    return extractBetween(
      cleaned,
      ["About the job", "Job Description", "About this role"],
      ["Similar jobs", "Meet the hiring team", "About the company"],
      8000
    );
  }
  if (hostname.includes("indeed.com")) {
    return extractBetween(
      cleaned,
      ["Full job description", "Job Description", "About the role"],
      ["Company details", "Report this job", "Job Type:"],
      8000
    );
  }

  return null;
}

/**
 * Stage 3: Meta Tag OpenGraph Fallback
 */
function extractFromMetaTags(html: string): string | null {
  const ogMatch =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (ogMatch && ogMatch[1]) {
    const text = cleanHtmlText(ogMatch[1]);
    if (text.length >= 100 && !isAuthWall(text)) return text;
  }
  return null;
}

/**
 * Helper: Clean HTML to readable plain text
 */
function cleanHtmlText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

function extractBetween(
  text: string,
  startMarkers: string[],
  endMarkers: string[],
  maxLen: number
): string {
  let startIdx = -1;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      startIdx = idx;
      break;
    }
  }
  if (startIdx === -1) return "";

  let endIdx = text.length;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker, startIdx + 50);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  return text.slice(startIdx, Math.min(endIdx, startIdx + maxLen)).trim();
}

function extractDensestBlock(html: string): string {
  const cleaned = cleanHtmlText(html);
  const paragraphs = cleaned.split(/\n{2,}/).filter((p) => p.trim().length > 40);
  const jobKeywords = [
    "responsibilities",
    "requirements",
    "qualifications",
    "experience",
    "skills",
    "role",
    "team",
    "position",
    "candidate",
    "job",
    "work",
  ];

  const scored = paragraphs.map((p) => {
    const lower = p.toLowerCase();
    const score =
      jobKeywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0) +
      Math.min(p.length / 100, 5);
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  let result = "";
  for (const { p } of scored.slice(0, 20)) {
    if (result.length + p.length > 5000) break;
    result += p + "\n\n";
  }
  return result.trim();
}
