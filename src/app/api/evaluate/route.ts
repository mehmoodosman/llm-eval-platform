import { NextResponse } from "next/server";
import { createLLMChain } from "@/lib/llm-config";
import { TimingInfo } from "llm-chain/dist/types";
import { StreamingMetrics } from "llm-chain/dist/utils/timing";

interface EvaluationRequest {
  systemPrompt: string;
  userMessage: string;
  expectedOutput: string;
  selectedModels: string[];
}

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start processing in the background
  const processPromise = (async () => {
    try {
      const body = (await request.json()) as EvaluationRequest;
      const { systemPrompt, userMessage, selectedModels } = body;

      // Track responses for each model
      const modelResponses = new Map<string, string>();

      // Initialize responses for each model
      for (const modelId of selectedModels) {
        modelResponses.set(modelId, "");
        // Send initial state
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              model: modelId,
              response: "",
              delta: "",
            })}\n\n`
          )
        );
      }

      // Process each model in parallel
      await Promise.all(
        selectedModels.map(async modelId => {
          try {
            const client = createLLMChain(modelId);

            await client.streamChatCompletion(
              {
                model: modelId,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userMessage },
                ],
              },
              async (message: string) => {
                // Update accumulated response
                const currentResponse = modelResponses.get(modelId) || "";
                const newResponse = currentResponse + message;
                modelResponses.set(modelId, newResponse);

                // Send delta update
                await writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      model: modelId,
                      response: newResponse,
                      delta: message,
                    })}\n\n`
                  )
                );
              },
              (timing: TimingInfo & { streaming?: StreamingMetrics }) => {
                // Send timing metrics update
                writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      model: modelId,
                      metrics: {
                        ...timing,
                        streaming: timing.streaming,
                      },
                    })}\n\n`
                  )
                );
                console.log("Timing:", timing);
              }
            );
          } catch (error) {
            // Send error state
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  model: modelId,
                  response: "",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Unknown error occurred",
                })}\n\n`
              )
            );
          }
        })
      );
    } catch (error) {
      console.error("Evaluation error:", error);
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            error: "Failed to process evaluation request",
          })}\n\n`
        )
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
