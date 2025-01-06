"use client";

import { useEvaluationStore } from "@/stores/evaluation-store";
import { TextAreaField } from "./evaluation/TextAreaField";
import { ModelSelector } from "./evaluation/ModelSelector";
import { ResponseList } from "./evaluation/ResponseList";
import { EvaluationButton } from "./evaluation/EvaluationButton";
import { useState } from "react";

export function EvaluationForm() {
  const {
    systemPrompt,
    userMessage,
    expectedOutput,
    selectedModels,
    responses,
    isLoading,
    setSystemPrompt,
    setUserMessage,
    setExpectedOutput,
    toggleModel,
    setResponses,
    setIsLoading,
  } = useEvaluationStore();

  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStreaming(true);
    setResponses([]);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          userMessage,
          expectedOutput,
          selectedModels,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      // Initialize responses for each model
      const responseMap = new Map<
        string,
        {
          response: string;
          metrics?: {
            startTime: number;
            endTime: number;
            duration: number;
            streaming?: {
              timeToFirstToken: number;
              tokensPerSecond: number;
              totalResponseTime: number;
              totalTokens: number;
            };
          };
        }
      >();
      selectedModels.forEach(model => responseMap.set(model, { response: "" }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));

              if (data.error) {
                console.error("Stream error:", data.error);
                continue;
              }

              // Get current state for this model
              const currentState = responseMap.get(data.model) || {
                response: "",
              };

              // Update response if present
              if (data.response !== undefined) {
                currentState.response = data.response;
              }

              // Update metrics if present
              if (data.metrics) {
                currentState.metrics = data.metrics;
              }

              // Update the response map
              responseMap.set(data.model, currentState);

              // Convert map to array and update state
              const currentResponses = Array.from(responseMap.entries()).map(
                ([model, state]) => ({
                  model,
                  response: state.response,
                  metrics: state.metrics,
                })
              );
              setResponses(currentResponses);
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Evaluation error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <TextAreaField
        label="System Prompt"
        value={systemPrompt}
        onChange={setSystemPrompt}
        placeholder="Enter system prompt..."
      />

      <TextAreaField
        label="User Message"
        value={userMessage}
        onChange={setUserMessage}
        placeholder="Enter user message..."
      />

      <TextAreaField
        label="Expected Output"
        value={expectedOutput}
        onChange={setExpectedOutput}
        placeholder="Enter expected output..."
      />

      <ModelSelector
        selectedModels={selectedModels}
        onToggleModel={toggleModel}
      />

      <EvaluationButton isLoading={isLoading} onClick={handleSubmit} />

      <ResponseList responses={responses} isStreaming={isStreaming} />
    </form>
  );
}
