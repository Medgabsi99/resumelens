import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Handles nav link clicks (href="/api/auth/signout")
export async function GET() {
  const supabase = createServerComponentClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}

// Handles fetch("/api/auth/signout", { method: "POST" }) from DashboardLayout
export async function POST() {
  const supabase = createServerComponentClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
