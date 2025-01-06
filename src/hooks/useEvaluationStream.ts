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
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [testCaseId, setTestCaseId] = useState<string | null>(null);

  const processStreamLine = (
    line: string,
    responseMap: Map<string, Response>
  ): Map<string, Response> => {
    if (!line.startsWith("data: ")) return responseMap;

    try {
      const data: StreamUpdate = JSON.parse(line.slice(5));
      console.log("Processing stream line:", {
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
      console.log("Updated response state:", {
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
    console.log("Attempting to save results:", {
      responses,
      experimentId,
      testCaseId,
    });
    try {
      // Save results for each model response
      await Promise.all(
        responses.map(async response => {
          const result = {
            experimentId,
            testCaseId,
            response: response.response,
            error: response.error,
            metrics: response.metrics?.evaluation,
            exactMatchScore:
              response.metrics?.evaluation?.EXACT_MATCH?.toString(),
            llmMatchScore: response.metrics?.evaluation?.LLM_JUDGE?.toString(),
            cosineSimilarityScore:
              response.metrics?.evaluation?.COSINE_SIMILARITY?.toString(),
          };
          console.log("Saving result for model:", response.model, result);

          const res = await fetch("/api/experiment-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("Failed to save result:", {
              status: res.status,
              error: errorText,
            });
            throw new Error(
              `Failed to save result for model ${response.model}: ${errorText}`
            );
          }

          const savedResult = await res.json();
          console.log("Successfully saved result:", savedResult);
        })
      );
    } catch (error) {
      console.error("Error in saveResults:", error);
      throw error;
    }
  };

  const createExperimentAndTestCase = async (request: EvaluationRequest) => {
    try {
      // Create test case first
      console.log("Creating test case with:", {
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
        console.error("Failed to create test case:", error);
        throw new Error("Failed to create test case");
      }

      const testCase = await testCaseResponse.json();
      console.log("Created test case:", testCase);
      setTestCaseId(testCase.id);

      // Create experiment with the test case
      console.log("Creating experiment with:", {
        name: `Evaluation ${new Date().toISOString()}`,
        systemPrompt: request.systemPrompt,
        model: request.selectedModels[0],
        testCaseIds: [testCase.id],
      });

      const experimentResponse = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Evaluation ${new Date().toISOString()}`,
          systemPrompt: request.systemPrompt,
          model: request.selectedModels[0], // Use first model as primary
          testCaseIds: [testCase.id],
        }),
      });

      if (!experimentResponse.ok) {
        const error = await experimentResponse.text();
        console.error("Failed to create experiment:", error);
        throw new Error("Failed to create experiment");
      }

      const experiment = await experimentResponse.json();
      console.log("Created experiment:", experiment);
      setExperimentId(experiment.id);

      return { experimentId: experiment.id, testCaseId: testCase.id };
    } catch (error) {
      logger.error("Error creating experiment and test case:", error);
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
      console.log("Created experiment and test case:", {
        experimentId,
        testCaseId,
      });

      // Then start the evaluation
      const reader = await submitEvaluation(request);
      const finalResponses = await handleStreamData(
        reader,
        request.selectedModels
      );

      console.log("Stream data handled, final responses:", finalResponses);

      // After streaming is complete, save the results
      if (finalResponses.length > 0) {
        console.log("Calling saveResults with:", {
          responses: finalResponses,
          experimentId,
          testCaseId,
        });
        await saveResults(finalResponses, experimentId, testCaseId);
      } else {
        console.log("No responses to save");
      }
    } catch (error) {
      console.error("Evaluation error:", error);
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
