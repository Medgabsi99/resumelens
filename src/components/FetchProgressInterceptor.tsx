"use client";

/**
 * FetchProgressInterceptor
 * Wraps window.fetch to automatically start/finish the global progress bar
 * for any in-flight network request made from the browser.
 *
 * Only fires for same-origin /api/* requests (not CDN, fonts, analytics).
 * Must be rendered inside <ProgressProvider>.
 */

import { useEffect } from "react";
import { useProgress } from "./NavigationProgress";

export default function FetchProgressInterceptor() {
  const { start, done } = useProgress();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const original = window.fetch;
    let inFlight = 0;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ) {
      // Only intercept /api/ requests
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

      const isApiCall = url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/");

      if (isApiCall) {
        inFlight += 1;
        if (inFlight === 1) start();
      }

      try {
        const result = await original.call(this, input, init);
        return result;
      } finally {
        if (isApiCall) {
          inFlight = Math.max(0, inFlight - 1);
          if (inFlight === 0) done();
        }
      }
    };

    // Restore on unmount (hot reload safety)
    return () => {
      window.fetch = original;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
