import { logger } from "@/lib/logger";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createProfile } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  // Handle OAuth/Callback errors from Supabase
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (error) {
    logger.error("Supabase OAuth callback error", { error, errorDescription });
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = await createRouteHandlerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logger.error("Exchange code error:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (data?.user) {
      // Create profile row on first sign-in (safely checks first)
      await createProfile(data.user.id, data.user.email || "");
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
