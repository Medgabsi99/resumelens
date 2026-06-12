import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { handleCors, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await requireUser();
    const session = { user };

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      const errRes = NextResponse.json({ success: false, error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
      return handleCors(req, errRes);
    }

    const okRes = NextResponse.json({ success: true, data });
    return handleCors(req, okRes);
  } catch (err: unknown) {
    const errRes = NextResponse.json({ success: false, error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    return handleCors(req, errRes);
  }
}
