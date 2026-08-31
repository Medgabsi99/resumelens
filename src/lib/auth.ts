import { createServerComponentClient } from "@/lib/supabase-server";
import { createAdminClient } from "./supabase-server";
import { UserProfile } from "@/types";

export const PLAN_LIMITS = {
  free: 999999,
  one_time: 999999,
  monthly: 999999,
} as const;

// Get current authenticated user from Supabase Auth server (verifies JWT, not just cookies)
export async function getServerSession() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  // Return a session-shaped object for backward-compat with callers that read .user
  return { user };
}

// Authenticates user and returns the user object, or throws Error if not authenticated
export async function requireUser() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized");
  }
  return user;
}

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    redis = null;
  }
}

interface CacheEntry {
  profile: UserProfile | null;
  expiresAt: number;
}

const profileCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds cache lifetime for deduplication

// Get user profile (plan, usage etc.) from Supabase with distributed caching
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const cacheKey = `profile:${userId}`;

  // 1. Try distributed Redis cache
  if (redis) {
    try {
      const cached = await redis.get<UserProfile>(cacheKey);
      if (cached) return cached;
    } catch {
      // Fall through to memory or database on Redis error
    }
  }

  // 2. Try in-memory fallback
  const now = Date.now();
  const memCached = profileCache.get(userId);
  if (memCached && memCached.expiresAt > now) {
    return memCached.profile;
  }

  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) {
    profileCache.set(userId, { profile: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }

  const profile = data as UserProfile;
  profileCache.set(userId, { profile, expiresAt: now + CACHE_TTL_MS });

  if (redis) {
    redis.set(cacheKey, profile, { ex: 5 }).catch(() => {});
  }

  return profile;
}

// Check if user can run another analysis
export function canAnalyze(profile: UserProfile): boolean {
  const limit = PLAN_LIMITS[profile.plan] ?? 999;
  return profile.analyses_used < limit;
}

// Centralized quota guard: verifies auth AND checks user plan quota
export async function requireUserWithQuota() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  if (profile && !canAnalyze(profile)) {
    throw new Error("QuotaExceeded");
  }
  return { user, profile };
}

// Increment usage counter
export async function incrementUsage(userId: string) {
  const admin = createAdminClient();
  await admin.rpc("increment_analyses_used", { user_id: userId });
  // Invalidate cache immediately on update
  profileCache.delete(userId);
  if (redis) {
    redis.del(`profile:${userId}`).catch(() => {});
  }
}

// Create profile row on first sign-up (called from webhook or sign-up handler)
export async function createProfile(userId: string, email: string) {
  // Invalidate cache in case we check before insert
  profileCache.delete(userId);
  if (redis) {
    redis.del(`profile:${userId}`).catch(() => {});
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  await admin.from("profiles").insert({
    id: userId,
    email,
    plan: "free",
    analyses_used: 0,
    analyses_limit: PLAN_LIMITS.free,
  });
}
