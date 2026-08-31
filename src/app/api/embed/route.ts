import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { generateAndStoreEmbeddings } from "@/lib/ai/embedPipeline";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { resumeText?: string; analysisId?: string; resumeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeText, analysisId, resumeId } = body;

  if (!resumeText || resumeText.trim().length < 100) {
    return NextResponse.json(
      { success: false, error: "resumeText is required and must be ≥100 characters" },
      { status: 400 }
    );
  }

  const result = await generateAndStoreEmbeddings({
    userId: user.id,
    resumeText,
    analysisId,
    resumeId,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Embedding failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, chunksCreated: result.chunksCreated });
}
