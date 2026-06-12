import { NextRequest, NextResponse } from "next/server";

export function handleCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && origin.startsWith("chrome-extension://")) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  return res;
}

export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    if (origin && origin.startsWith("chrome-extension://")) {
      const res = new NextResponse(null, { status: 204 });
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      return res;
    }
  }
  return null;
}
