import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";
import { handleCors, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      const errRes = NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      return handleCors(req, errRes);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("resumes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      const errRes = NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return handleCors(req, errRes);
    }

    const okRes = NextResponse.json({ success: true, data });
    return handleCors(req, okRes);
  } catch (err: any) {
    const errRes = NextResponse.json({ success: false, error: err.message }, { status: 500 });
    return handleCors(req, errRes);
  }
}
