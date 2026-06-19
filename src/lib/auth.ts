import { createServerComponentClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase";
import { UserProfile } from "@/types";
import { PLAN_LIMITS } from "./stripe";

// Get current authenticated user from Supabase Auth server (verifies JWT, not just cookies)
export async function getServerSession() {
  const supabase = createServerComponentClient({ cookies });
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
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized");
  }
  return user;
}

interface CacheEntry {
  profile: UserProfile | null;
  expiresAt: number;
}

const profileCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds cache lifetime is perfect for short-lived deduplication

// Get user profile (plan, usage etc.) from Supabase
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const now = Date.now();
  const cached = profileCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.profile;
  }

  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    profileCache.set(userId, { profile: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }

  const profile = data as UserProfile;
  profileCache.set(userId, { profile, expiresAt: now + CACHE_TTL_MS });
  return profile;
}

// Check if user can run another analysis
export function canAnalyze(profile: UserProfile): boolean {
  const limit = PLAN_LIMITS[profile.plan];
  return profile.analyses_used < limit;
}

// Increment usage counter
export async function incrementUsage(userId: string) {
  const admin = createAdminClient();
  await admin.rpc("increment_analyses_used", { user_id: userId });
  // Invalidate cache immediately on update
  profileCache.delete(userId);
}

// Create profile row on first sign-up (called from webhook or sign-up handler)
export async function createProfile(userId: string, email: string) {
  // Invalidate cache in case we check before insert
  profileCache.delete(userId);

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
