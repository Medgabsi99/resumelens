import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createDefaultQueryClient } from "../queryClient.ts";
import { QUERY_KEYS } from "../../hooks/queries/dashboardQueries.ts";

describe("TanStack Query Data Layer & Cache Configuration", () => {
  test("createDefaultQueryClient configures optimal production caching policies", () => {
    const client = createDefaultQueryClient();
    const defaultOptions = client.getDefaultOptions();

    // 5 minutes stale time
    assert.equal(defaultOptions.queries?.staleTime, 5 * 60 * 1000);
    // 30 minutes garbage collection time
    assert.equal(defaultOptions.queries?.gcTime, 30 * 60 * 1000);
    // No unwanted window focus refetches
    assert.equal(defaultOptions.queries?.refetchOnWindowFocus, false);
    // Single transient retry
    assert.equal(defaultOptions.queries?.retry, 1);
  });

  test("QUERY_KEYS contains properly structured cache domain keys", () => {
    assert.deepEqual(QUERY_KEYS.analyses, ["dashboard", "analyses"]);
    assert.deepEqual(QUERY_KEYS.applications, ["dashboard", "applications"]);
    assert.deepEqual(QUERY_KEYS.savedResumes, ["savedResumes"]);
  });
});
