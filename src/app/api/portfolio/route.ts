import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const analysisId = req.nextUrl.searchParams.get("analysisId");
    if (!analysisId) {
      return NextResponse.json({ success: false, error: "analysisId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_portfolios")
      .select("*")
      .eq("analysis_id", analysisId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { analysisId, theme, content } = body;

    if (!analysisId || !theme || !content) {
      return NextResponse.json({ success: false, error: "analysisId, theme, and content are required" }, { status: 400 });
    }

    // Check if portfolio already exists
    const { data: existing, error: checkError } = await supabase
      .from("user_portfolios")
      .select("id")
      .eq("analysis_id", analysisId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("user_portfolios")
        .update({ theme, content })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from("user_portfolios")
        .insert({
          user_id: session.user.id,
          analysis_id: analysisId,
          theme,
          content,
        })
        .select()
        .single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
