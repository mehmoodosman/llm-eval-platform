import { useState, useCallback } from "react";
import { StreamUpdate, Response, EvaluationRequest } from "@/types/evaluation";
import { Logger } from "@/utils/logger";
import { submitEvaluation } from "@/lib/evaluation-service";
import { useEvaluationStore } from "@/stores/evaluation-store";
import { ALL_MODELS } from "@/lib/models";

const logger = new Logger("useEvaluationStream");

interface UseEvaluationStreamReturn {
  isStreaming: boolean;
  handleSubmit: (request: EvaluationRequest) => Promise<void>;
  responses: Response[];
}

export function useEvaluationStream(): UseEvaluationStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [testCaseId, setTestCaseId] = useState<string | null>(null);

  const processStreamLine = (
    line: string,
    responseMap: Map<string, Response>
  ): Map<string, Response> => {
    if (!line.startsWith("data: ")) return responseMap;

    try {
      const data: StreamUpdate = JSON.parse(line.slice(5));
      logger.info("Processing stream line", {
        model: data.model,
        metrics: data.metrics,
      });

      if (data.error) {
        logger.error("Stream error:", { error: data.error, model: data.model });
        return responseMap;
      }

      const currentState = responseMap.get(data.model) || {
        model: data.model,
        response: "",
      };

      const updatedState = {
        ...currentState,
        response: data.response ?? currentState.response,
        metrics: data.metrics,
      };
      logger.info("Updated response state", {
        model: data.model,
        state: updatedState,
      });

      responseMap.set(data.model, updatedState);
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

      // Return the final responses
      return Array.from(responseMap.values());
    } catch (error) {
      logger.error("Error processing stream:", error);
      throw error;
    }
  };

  const saveResults = async (
    responses: Response[],
    experimentId: string,
    testCaseId: string
  ) => {
    logger.info("Attempting to save results", {
      responses,
      experimentId,
      testCaseId,
    });
    try {
      // Save results for each model response
      await Promise.all(
        responses.map(async response => {
          // Convert model value to UUID
          const modelId = ALL_MODELS.find(m => m.value === response.model)?.id;
          logger.info("Found model ID", { model: response.model, modelId });

          if (!modelId) {
            logger.error("Model not found", { model: response.model });
            throw new Error(`Could not find model ID for ${response.model}`);
          }

          const result = {
            experimentId,
            testCaseId,
            modelId,
            response: response.response,
            error: response.error,
            metrics: response.metrics?.evaluation,
            exactMatchScore:
              response.metrics?.evaluation?.EXACT_MATCH?.toString(),
            llmMatchScore: response.metrics?.evaluation?.LLM_JUDGE
              ? (response.metrics.evaluation.LLM_JUDGE / 100).toString()
              : undefined,
            cosineSimilarityScore:
              response.metrics?.evaluation?.COSINE_SIMILARITY?.toString(),
          };
          logger.info("Prepared result for saving", result);

          const res = await fetch("/api/experiment-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
          });

          if (!res.ok) {
            const errorText = await res.text();
            logger.error("Failed to save result", {
              status: res.status,
              error: errorText,
              result,
            });
            throw new Error(
              `Failed to save result for model ${response.model}: ${errorText}`
            );
          }

          const savedResult = await res.json();
          logger.info("Successfully saved result", savedResult);
        })
      );
    } catch (error) {
      logger.error("Error in saveResults", error);
      throw error;
    }
  };

  const createExperimentAndTestCase = async (request: EvaluationRequest) => {
    try {
      // Get current experiment ID from store
      const currentExperimentId = useEvaluationStore.getState().experimentId;

      if (!currentExperimentId) {
        throw new Error("No experiment ID found. Cannot create test case.");
      }

      // Create test case first
      logger.info("Creating test case", {
        userMessage: request.userMessage,
        expectedOutput: request.expectedOutput,
        metrics: request.selectedMetrics,
      });

      const testCaseResponse = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: request.userMessage,
          expectedOutput: request.expectedOutput,
          metrics: request.selectedMetrics,
        }),
      });

      if (!testCaseResponse.ok) {
        const error = await testCaseResponse.text();
        logger.error("Failed to create test case", error);
        throw new Error("Failed to create test case");
      }

      const testCase = await testCaseResponse.json();
      logger.info("Created test case", testCase);
      setTestCaseId(testCase.id);

      // Link test case to existing experiment
      const linkResponse = await fetch(
        `/api/experiments/${currentExperimentId}/test-cases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testCaseId: testCase.id,
          }),
        }
      );

      if (!linkResponse.ok) {
        const error = await linkResponse.text();
        logger.error("Failed to link test case to experiment", error);
        throw new Error("Failed to link test case to experiment");
      }

      return { experimentId: currentExperimentId, testCaseId: testCase.id };
    } catch (error) {
      logger.error("Error creating test case", error);
      throw error;
    }
  };

  const handleSubmit = async (request: EvaluationRequest) => {
    const setIsLoading = useEvaluationStore.getState().setIsLoading;
    setIsStreaming(true);
    setIsLoading(true);
    setResponses([]);

    try {
      // First create the experiment and test case
      const { experimentId, testCaseId } =
        await createExperimentAndTestCase(request);
      logger.info("Created experiment and test case", {
        experimentId,
        testCaseId,
      });

      // Then start the evaluation
      const reader = await submitEvaluation(request);
      const finalResponses = await handleStreamData(
        reader,
        request.selectedModels
      );

      logger.info("Stream data handled", { finalResponses });

      // After streaming is complete, save the results
      if (finalResponses.length > 0) {
        logger.info("Calling saveResults", {
          responses: finalResponses,
          experimentId,
          testCaseId,
        });
        await saveResults(finalResponses, experimentId, testCaseId);
      } else {
        logger.info("No responses to save");
      }
    } catch (error) {
      logger.error("Evaluation error", error);
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
