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
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new EvaluationError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new EvaluationError("No reader available");
    }

    return reader;
  } catch (error) {
    logger.error("Failed to submit evaluation:", error);
    throw error instanceof EvaluationError
      ? error
      : new EvaluationError(
          error instanceof Error ? error.message : "Unknown error"
        );
  }
}
