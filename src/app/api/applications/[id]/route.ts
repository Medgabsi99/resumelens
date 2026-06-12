import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import {
  ApplicationStatus,
  JobApplication,
  Priority,
  UpdateApplicationRequest,
} from "@/types";

const VALID_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "accepted",
];

const VALID_PRIORITIES: Priority[] = ["low", "medium", "high"];

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── 1. Auth check ────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  const applicationId = params.id;
  if (!applicationId) {
    return NextResponse.json(
      { success: false, error: "Application ID is required" },
      { status: 400 }
    );
  }

  // ── 2. Parse and validate body ───────────────────────────
  const body = (await req.json()) as UpdateApplicationRequest;

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: `Invalid status: ${body.status}` },
      { status: 400 }
    );
  }

  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    return NextResponse.json(
      { success: false, error: `Invalid priority: ${body.priority}` },
      { status: 400 }
    );
  }

  // ── 3. Build update payload (only include provided fields) ──
  const updateData: Record<string, unknown> = {};
  if (body.companyName !== undefined) updateData.company_name = body.companyName.trim();
  if (body.jobTitle !== undefined) updateData.job_title = body.jobTitle.trim();
  if (body.jobUrl !== undefined) updateData.job_url = body.jobUrl?.trim() || null;
  if (body.jobDescription !== undefined) updateData.job_description = body.jobDescription?.trim() || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.location !== undefined) updateData.location = body.location?.trim() || null;
  if (body.salaryMin !== undefined) updateData.salary_min = body.salaryMin ?? null;
  if (body.salaryMax !== undefined) updateData.salary_max = body.salaryMax ?? null;
  if (body.salaryCurrency !== undefined) updateData.salary_currency = body.salaryCurrency || "USD";
  if (body.contactName !== undefined) updateData.contact_name = body.contactName?.trim() || null;
  if (body.contactEmail !== undefined) updateData.contact_email = body.contactEmail?.trim() || null;
  if (body.appliedAt !== undefined) updateData.applied_at = body.appliedAt || null;
  if (body.deadlineAt !== undefined) updateData.deadline_at = body.deadlineAt || null;
  if (body.followUpAt !== undefined) updateData.follow_up_at = body.followUpAt || null;
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.resumeId !== undefined) updateData.resume_id = body.resumeId || null;
  if (body.matchScore !== undefined) updateData.match_score = body.matchScore ?? null;

  // ── 4. Update in database (RLS enforces user_id match) ──
  const { data, error } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", applicationId)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Application not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: data as JobApplication });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── 1. Auth check ────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  const applicationId = params.id;
  if (!applicationId) {
    return NextResponse.json(
      { success: false, error: "Application ID is required" },
      { status: 400 }
    );
  }

  // ── 2. Delete (RLS ensures user can only delete their own) ─
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", session.user.id);

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
