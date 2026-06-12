import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Handles nav link clicks (href="/api/auth/signout")
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}

// Handles fetch("/api/auth/signout", { method: "POST" }) from DashboardLayout
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
