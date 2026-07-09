import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  CreateApplicationRequest,
  JobApplication,
  ApplicationStatus,
  Priority,
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

export async function GET() {
  // ── 1. Auth check ────────────────────────────────────────
  const _user = await requireUser();
  const supabase = createServerComponentClient({ cookies });

  // ── 2. Fetch applications ────────────────────────────────
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", _user.id)
    .order("created_at", { ascending: false });

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data as JobApplication[] });
}

export async function POST(req: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────
  const _user = await requireUser();
  const supabase = createServerComponentClient({ cookies });

  // ── 2. Parse and validate request ────────────────────────
  const body = (await req.json()) as CreateApplicationRequest;

  if (!body.companyName?.trim() || !body.jobTitle?.trim()) {
    return NextResponse.json(
      { success: false, error: "Company name and job title are required" },
      { status: 400 }
    );
  }

  const status = body.status || "saved";
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: `Invalid status: ${status}` },
      { status: 400 }
    );
  }

  const priority = body.priority || "medium";
  if (!VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json(
      { success: false, error: `Invalid priority: ${priority}` },
      { status: 400 }
    );
  }

  // ── 3. Insert into database ──────────────────────────────
  const insertData = {
    user_id: _user.id,
    company_name: body.companyName.trim(),
    job_title: body.jobTitle.trim(),
    job_url: body.jobUrl?.trim() || null,
    job_description: body.jobDescription?.trim() || null,
    status,
    priority,
    location: body.location?.trim() || null,
    salary_min: body.salaryMin ?? null,
    salary_max: body.salaryMax ?? null,
    salary_currency: body.salaryCurrency || "USD",
    contact_name: body.contactName?.trim() || null,
    contact_email: body.contactEmail?.trim() || null,
    applied_at: body.appliedAt || null,
    deadline_at: body.deadlineAt || null,
    follow_up_at: body.followUpAt || null,
    notes: body.notes?.trim() || null,
    resume_id: body.resumeId || null,
    match_score: body.matchScore ?? null,
  };

  const { data, error } = await supabase
    .from("applications")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data as JobApplication });
}
