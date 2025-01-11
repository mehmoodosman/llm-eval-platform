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
  logger.info(`Starting evaluation for model: ${modelId}`, {
    selectedMetrics,
    promptLength: systemPrompt.length,
    messageLength: userMessage.length,
  });

  try {
    logger.debug(`Creating LLM chain for model: ${modelId}`);
    const client = createLLMChain(modelId);

    // Initialize empty response
    modelResponses.set(modelId, "");
    logger.debug(`Initialized empty response for model: ${modelId}`);

    await writeStreamUpdate(writer, {
      model: modelId,
      response: "",
      delta: "",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastTiming: any = null;
    let tokenCount = 0;

    logger.info(`Starting stream completion for model: ${modelId}`);
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
        tokenCount++;
        const currentResponse = modelResponses.get(modelId) || "";
        const newResponse = currentResponse + message;
        modelResponses.set(modelId, newResponse);

        logger.debug(`Stream update for ${modelId}`, {
          deltaLength: message.length,
          totalResponseLength: newResponse.length,
          tokenCount,
        });

        await writeStreamUpdate(writer, {
          model: modelId,
          response: newResponse,
          delta: message,
        });
      },
      // Store timing metrics
      async timing => {
        lastTiming = timing;
        logger.debug(`Timing update for ${modelId}`, timing);
      }
    );

    logger.info(`Completed stream for model: ${modelId}`, {
      finalResponseLength: modelResponses.get(modelId)?.length,
      timing: lastTiming,
    });

    // After completion, evaluate the final response
    const finalResponse = modelResponses.get(modelId) || "";
    logger.debug(`Starting evaluation for ${modelId}`, {
      responseLength: finalResponse.length,
      expectedOutputLength: expectedOutput.length,
    });

    const evaluationResults = await evaluateResponse(
      finalResponse,
      expectedOutput,
      selectedMetrics
    );

    logger.info(`Evaluation completed for ${modelId}`, {
      metrics: evaluationResults,
      timing: lastTiming,
    });

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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Error processing model ${modelId}`, error, {
      systemPromptLength: systemPrompt.length,
      userMessageLength: userMessage.length,
      currentResponseLength: modelResponses.get(modelId)?.length,
    });

    await writeStreamUpdate(writer, {
      model: modelId,
      response: "",
      error: errorMessage,
    });
    throw new EvaluationError(errorMessage, modelId);
  }
}

export async function POST(request: Request) {
  logger.info("Received evaluation request");
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
        systemPromptLength: systemPrompt.length,
        userMessageLength: userMessage.length,
        expectedOutputLength: expectedOutput.length,
      });

      // Track responses for each model
      const modelResponses = new Map<string, string>();

      logger.debug("Starting parallel model evaluations", {
        modelCount: selectedModels.length,
      });

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

      // Log results summary
      const successCount = results.filter(r => r.status === "fulfilled").length;
      const failureCount = results.filter(r => r.status === "rejected").length;

      logger.info("Completed all model evaluations", {
        totalModels: selectedModels.length,
        successCount,
        failureCount,
      });

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
      logger.error("Fatal evaluation error", error, {
        isClosing,
      });
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
        logger.debug("Closing writer stream");
        await writer.close();
      } catch (error) {
        logger.error("Error closing writer stream:", error);
      }
    }
  })();

  return createStreamResponse(stream);
}
