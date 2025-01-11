import { EvaluationRequest } from "@/types/evaluation";
import { Logger } from "@/utils/logger";

const logger = new Logger("EvaluationService");

export class EvaluationError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

export async function submitEvaluation(
  request: EvaluationRequest
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  try {
    logger.info("Submitting evaluation request", {
      selectedModels: request.selectedModels,
      selectedMetrics: request.selectedMetrics,
      messageLength: request.userMessage.length,
      expectedOutputLength: request.expectedOutput.length,
    });

    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    logger.info("Received evaluation response", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      logger.error("Evaluation request failed", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new EvaluationError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error("Stream reader initialization failed - no reader available");
      throw new EvaluationError("No reader available");
    }

    logger.info("Stream reader initialized successfully");
    return reader;
  } catch (error) {
    logger.error("Failed to submit evaluation:", {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      status: error instanceof EvaluationError ? error.status : undefined,
    });

    throw error instanceof EvaluationError
      ? error
      : new EvaluationError(
          error instanceof Error ? error.message : String(error)
        );
  }
}
