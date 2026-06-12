import { createServerComponentClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase";
import { UserProfile } from "@/types";
import { PLAN_LIMITS } from "./stripe";

// Get current session user in server components
export async function getServerSession() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// Get user profile (plan, usage etc.) from Supabase
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
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
}

// Create profile row on first sign-up (called from webhook or sign-up handler)
export async function createProfile(userId: string, email: string) {
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
