import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generatePortfolio } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 }
      );
    }

    const data = await generatePortfolio(resumeText);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Generate portfolio error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate portfolio copy" },
      { status: 500 }
    );
  }
}
