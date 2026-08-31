import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const startTime = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  const envStatus = {
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    googleAiConfigured: Boolean(process.env.GOOGLE_AI_API_KEY),
    redisConfigured: Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ),
  };

  const isHealthy = envStatus.supabaseConfigured && envStatus.googleAiConfigured;
  const status = isHealthy ? "ok" : "degraded";
  const statusCode = isHealthy ? 200 : 200; // Always return 200 for health probes so load balancers don't flap during dev setups

  const payload = {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    version: process.env.npm_package_version || "1.0.0",
    nodeVersion: process.version,
    services: envStatus,
    memory: {
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 10) / 10,
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10,
    },
  };

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
