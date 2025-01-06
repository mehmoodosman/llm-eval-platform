import { useState, useCallback } from "react";
import { StreamUpdate, Response, EvaluationRequest } from "@/types/evaluation";
import { Logger } from "@/utils/logger";
import { submitEvaluation } from "@/lib/evaluation-service";
import { useEvaluationStore } from "@/stores/evaluation-store";

const logger = new Logger("useEvaluationStream");

interface UseEvaluationStreamReturn {
  isStreaming: boolean;
  handleSubmit: (request: EvaluationRequest) => Promise<void>;
  responses: Response[];
}

export function useEvaluationStream(): UseEvaluationStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);

  const processStreamLine = (
    line: string,
    responseMap: Map<string, Response>
  ): Map<string, Response> => {
    if (!line.startsWith("data: ")) return responseMap;

    try {
      const data: StreamUpdate = JSON.parse(line.slice(5));

      if (data.error) {
        logger.error("Stream error:", { error: data.error, model: data.model });
        return responseMap;
      }

      const currentState = responseMap.get(data.model) || {
        model: data.model,
        response: "",
      };

      responseMap.set(data.model, {
        ...currentState,
        response: data.response ?? currentState.response,
        metrics: data.metrics,
      });

      return responseMap;
    } catch (error) {
      logger.error("Error parsing SSE data:", error);
      return responseMap;
    }
  };

  const updateResponseState = useCallback(
    (responseMap: Map<string, Response>) => {
      const currentResponses = Array.from(responseMap.entries()).map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, state]) => state
      );
      setResponses(currentResponses);
    },
    []
  );

  const initializeResponseMap = (models: string[]): Map<string, Response> => {
    const responseMap = new Map();
    models.forEach(model => responseMap.set(model, { model, response: "" }));
    return responseMap;
  };

  const handleStreamData = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    models: string[]
  ) => {
    const decoder = new TextDecoder();
    const responseMap = initializeResponseMap(models);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          const updatedMap = processStreamLine(line, responseMap);
          updateResponseState(updatedMap);
        }
      }
    } catch (error) {
      logger.error("Error processing stream:", error);
      throw error;
    }
  };

  const handleSubmit = async (request: EvaluationRequest) => {
    const setIsLoading = useEvaluationStore.getState().setIsLoading;
    setIsStreaming(true);
    setIsLoading(true);
    setResponses([]);

    try {
      const reader = await submitEvaluation(request);
      await handleStreamData(reader, request.selectedModels);
    } catch (error) {
      logger.error("Evaluation error:", error);
      setResponses([
        {
          model: "error",
          response: "An error occurred during evaluation. Please try again.",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  return {
    isStreaming,
    handleSubmit,
    responses,
  };
}
