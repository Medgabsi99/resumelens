import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createSSEResponse, readSSEStream } from "../sse.ts";

describe("Server-Sent Events (SSE) Streaming Infrastructure", () => {
  test("createSSEResponse generates standard text/event-stream headers", () => {
    const response = createSSEResponse(async (send, close) => {
      send({ score: 85 }, "score");
      close();
    });

    assert.equal(response.headers.get("Content-Type"), "text/event-stream; charset=utf-8");
    assert.equal(response.headers.get("Cache-Control"), "no-cache, no-transform");
    assert.equal(response.headers.get("Connection"), "keep-alive");
  });

  test("readSSEStream streams and aggregates chunks", async () => {
    const chunks = [];
    const mockResponse = createSSEResponse(async (send, close) => {
      send("First token ");
      send("Second token");
      close();
    });

    const accumulated = await readSSEStream(mockResponse, (chunk) => {
      chunks.push(chunk);
    });

    assert.equal(accumulated, "First token Second token");
    assert.ok(chunks.length >= 2);
  });
});
