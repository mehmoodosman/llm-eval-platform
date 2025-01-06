import { StreamUpdate } from "@/types/evaluation";

const encoder = new TextEncoder();

interface StreamError extends Error {
  code?: string;
}

export async function writeStreamUpdate(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  update: StreamUpdate
): Promise<void> {
  try {
    await writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
  } catch (error) {
    // Ignore write errors if they're due to a closed stream
    if ((error as StreamError)?.code !== "ERR_INVALID_STATE") {
      throw error;
    }
  }
}

export function createResponseStream(): {
  stream: ReadableStream;
  writer: WritableStreamDefaultWriter<Uint8Array>;
} {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  return { stream: readable, writer };
}

export function createStreamResponse(
  stream: ReadableStream<Uint8Array>
): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
