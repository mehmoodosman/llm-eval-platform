import { createLLMChain } from "@/lib/llm-config";
import { EvaluationRequest, EvaluationError } from "@/types/evaluation";
import {
  createResponseStream,
  createStreamResponse,
  writeStreamUpdate,
} from "@/utils/stream";
import { Logger } from "@/utils/logger";
import { evaluateResponse } from "@/lib/evaluation-metrics";

const logger = new Logger("evaluation-api");

async function processModelEvaluation(
  modelId: string,
  systemPrompt: string,
  userMessage: string,
  expectedOutput: string,
  selectedMetrics: EvaluationRequest["selectedMetrics"],
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastTiming: any = null;

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
      // Store timing metrics
      async timing => {
        lastTiming = timing;
      }
    );

    // After completion, evaluate the final response
    const finalResponse = modelResponses.get(modelId) || "";
    const evaluationResults = await evaluateResponse(
      finalResponse,
      expectedOutput,
      selectedMetrics
    );

    // Send final update with both timing and evaluation metrics
    await writeStreamUpdate(writer, {
      model: modelId,
      response: finalResponse,
      metrics: {
        ...lastTiming,
        streaming: lastTiming?.streaming,
        evaluation: evaluationResults,
      },
    });

    logger.debug("Model completion and evaluation metrics", {
      modelId,
      timing: lastTiming,
      evaluationResults,
    });
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
  let isClosing = false;

  // Start processing in the background
  (async () => {
    try {
      const body = (await request.json()) as EvaluationRequest;
      const {
        systemPrompt,
        userMessage,
        expectedOutput,
        selectedModels,
        selectedMetrics,
      } = body;

      logger.info("Processing evaluation request", {
        selectedModels,
        selectedMetrics,
      });

      // Track responses for each model
      const modelResponses = new Map<string, string>();

      // Process each model in parallel
      const results = await Promise.allSettled(
        selectedModels.map(modelId =>
          processModelEvaluation(
            modelId,
            systemPrompt,
            userMessage,
            expectedOutput,
            selectedMetrics,
            modelResponses,
            writer
          )
        )
      );

      // Log any errors from the parallel processing
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error(
            `Error processing model ${selectedModels[index]}:`,
            result.reason
          );
        }
      });
    } catch (error) {
      logger.error("Evaluation error", error);
      if (!isClosing) {
        await writeStreamUpdate(writer, {
          model: "system",
          response: "",
          error: "Failed to process evaluation request",
        });
      }
    } finally {
      isClosing = true;
      try {
        await writer.close();
      } catch (error) {
        logger.error("Error closing writer:", error);
      }
    }
  })();

  return createStreamResponse(stream);
}
