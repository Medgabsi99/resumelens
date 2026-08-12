import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute per user per route
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
  } catch (err) {
    logger.error("Failed to initialize Upstash Redis:", err);
  }
}

export async function checkRateLimit(userId: string, routeName: string) {
  if (!ratelimit) {
    // Fail-open for local development if Upstash environment variables are not set
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  try {
    const identifier = `ratelimit:${userId}:${routeName}`;
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    // If Upstash service fails/times out, fail-open to not block the user
    logger.error("Rate limit check failed:", err);
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

export function rateLimitResponse() {
  return NextResponse.json(
    { success: false, error: "Rate limit exceeded. Please wait a minute before trying again." },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    }
  );
}
