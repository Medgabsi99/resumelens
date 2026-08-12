/**
 * Server-Sent Events (SSE) Streaming Utility for Next.js App Router
 * Provides high-performance, real-time chunk streaming with standard SSE event framing.
 */

export interface SSEEvent {
  event?: string;
  data: string | Record<string, unknown>;
}

/**
 * Creates a standard Server-Sent Events HTTP Response
 */
export function createSSEResponse(
  generator: (
    send: (data: string | Record<string, unknown>, event?: string) => void,
    close: () => void
  ) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (data: string | Record<string, unknown>, event?: string) => {
        if (isClosed) return;
        const payload = typeof data === "object" ? JSON.stringify(data) : data;
        let chunk = "";
        if (event) {
          chunk += `event: ${event}\n`;
        }
        chunk += `data: ${payload.replace(/\n/g, "\\n")}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        controller.enqueue(encoder.encode("event: end\ndata: [DONE]\n\n"));
        controller.close();
      };

      try {
        await generator(send, close);
        if (!isClosed) {
          close();
        }
      } catch (err: unknown) {
        if (!isClosed) {
          const message = err instanceof Error ? err.message : "SSE stream processing error";
          send({ error: message }, "error");
          close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Client-side SSE Stream Reader Helper
 * Efficiently parses SSE streams from fetch Response objects.
 */
export async function readSSEStream(
  response: Response,
  onChunk: (chunkText: string) => void,
  onError?: (error: Error) => void
): Promise<string> {
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let accumulated = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || ""; // Retain trailing incomplete block in buffer

      for (const block of blocks) {
        if (!block.trim()) continue;
        const dataLines = block
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.replace(/^data:\s*/, ""));

        for (const rawData of dataLines) {
          if (rawData === "[DONE]") {
            return accumulated;
          }

          let textChunk = rawData.replace(/\\n/g, "\n");
          try {
            const parsed = JSON.parse(textChunk);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (typeof parsed.text === "string") {
              textChunk = parsed.text;
            }
          } catch {
            // Raw text chunk
          }

          accumulated += textChunk;
          onChunk(accumulated);
        }
      }
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) onError(error);
    throw error;
  }

  return accumulated;
}
