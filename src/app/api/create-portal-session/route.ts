import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireUser();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({ url: `${appUrl}/dashboard/settings` });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
