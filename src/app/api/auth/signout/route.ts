import { NextResponse } from "next/server";

// Handles nav link clicks (href="/api/auth/signout")
export async function GET() {
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}

// Handles fetch("/api/auth/signout", { method: "POST" }) from DashboardLayout
export async function POST() {
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
