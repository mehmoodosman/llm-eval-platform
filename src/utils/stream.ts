import { StreamUpdate } from "@/types/evaluation";

const encoder = new TextEncoder();

export async function writeStreamUpdate(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  update: StreamUpdate
): Promise<void> {
  await writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
}

export function createResponseStream(): {
  stream: ReadableStream<Uint8Array>;
  writer: WritableStreamDefaultWriter<Uint8Array>;
} {
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  return { stream: stream.readable, writer };
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
