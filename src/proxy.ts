import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public API endpoints and CORS preflights pass through
  if (
    pathname === "/api/webhook" ||
    pathname === "/api/scrape-job" ||
    pathname.startsWith("/api/extension/") ||
    request.method === "OPTIONS"
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If there is no authenticated user
  if (!user) {
    if (pathname.startsWith("/api/")) {
      const errorRes = NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
      if (pathname.startsWith("/api/ext/")) {
        const origin = request.headers.get("origin");
        if (origin && origin.startsWith("chrome-extension://")) {
          errorRes.headers.set("Access-Control-Allow-Origin", origin);
          errorRes.headers.set("Access-Control-Allow-Credentials", "true");
          errorRes.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
          );
          errorRes.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        }
      }

      // Delete stale auth cookies to prevent infinite refresh error spam
      request.cookies.getAll().forEach((c) => {
        if (c.name.startsWith("sb-")) {
          errorRes.cookies.delete(c.name);
        }
      });

      return errorRes;
    }

    if (pathname.startsWith("/dashboard")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      const redirectRes = NextResponse.redirect(redirectUrl);

      // Delete stale auth cookies to prevent infinite refresh error spam
      request.cookies.getAll().forEach((c) => {
        if (c.name.startsWith("sb-")) {
          redirectRes.cookies.delete(c.name);
        }
      });

      return redirectRes;
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
