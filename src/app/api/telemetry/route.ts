import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid telemetry payload" }, { status: 400 });
    }

    const { name, message, stack, url, breadcrumbs, context, timestamp } = payload;

    // Log structured error for centralized log drains (Datadog, CloudWatch, Sentry)
    logger.error(`[Client Exception] ${name}: ${message}`, {
      name,
      message,
      stack,
      url,
      breadcrumbsCount: Array.isArray(breadcrumbs) ? breadcrumbs.length : 0,
      breadcrumbs,
      context,
      clientTimestamp: timestamp,
      serverTimestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    logger.error("Telemetry ingestion failure:", err);
    return NextResponse.json({ error: "Failed to ingest telemetry" }, { status: 500 });
  }
}
