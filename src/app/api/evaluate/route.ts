import { createLLMChain } from "@/lib/llm-config";
import { EvaluationRequest, EvaluationError } from "@/types/evaluation";
import {
  createResponseStream,
  createStreamResponse,
  writeStreamUpdate,
} from "@/utils/stream";
import { Logger } from "@/utils/logger";

const logger = new Logger("evaluation-api");

async function processModelEvaluation(
  modelId: string,
  systemPrompt: string,
  userMessage: string,
  modelResponses: Map<string, string>,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  try {
    const client = createLLMChain(modelId);

    // Initialize empty response
    modelResponses.set(modelId, "");
    await writeStreamUpdate(writer, {
      model: modelId,
      response: "",
      delta: "",
    });

    await client.streamChatCompletion(
      {
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
      // Handle streaming updates
      async (message: string) => {
        const currentResponse = modelResponses.get(modelId) || "";
        const newResponse = currentResponse + message;
        modelResponses.set(modelId, newResponse);

        await writeStreamUpdate(writer, {
          model: modelId,
          response: newResponse,
          delta: message,
        });
      },
      // Handle metrics
      async timing => {
        await writeStreamUpdate(writer, {
          model: modelId,
          response: modelResponses.get(modelId) || "",
          metrics: {
            ...timing,
            streaming: timing.streaming,
          },
        });
        logger.debug("Model timing metrics", { modelId, timing });
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    await writeStreamUpdate(writer, {
      model: modelId,
      response: "",
      error: errorMessage,
    });
    throw new EvaluationError(errorMessage, modelId);
  }
}

export async function POST(request: Request) {
  const { stream, writer } = createResponseStream();

  // Start processing in the background
  (async () => {
    try {
      const body = (await request.json()) as EvaluationRequest;
      const { systemPrompt, userMessage, selectedModels } = body;

      logger.info("Processing evaluation request", { selectedModels });

      // Track responses for each model
      const modelResponses = new Map<string, string>();

      // Process each model in parallel
      await Promise.allSettled(
        selectedModels.map(modelId =>
          processModelEvaluation(
            modelId,
            systemPrompt,
            userMessage,
            modelResponses,
            writer
          )
        )
      );
    } catch (error) {
      logger.error("Evaluation error", error);
      await writeStreamUpdate(writer, {
        model: "system",
        response: "",
        error: "Failed to process evaluation request",
      });
    } finally {
      await writer.close();
    }
  })();

  return createStreamResponse(stream);
}
