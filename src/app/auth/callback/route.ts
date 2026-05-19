import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createProfile } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      // Create profile row on first sign-in
      await createProfile(data.user.id, data.user.email || "");
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
