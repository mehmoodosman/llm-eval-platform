"use client";

import { useEvaluationStore } from "@/stores/evaluation-store";
import { TextAreaField } from "./evaluation/TextAreaField";
import { ModelSelector } from "./evaluation/ModelSelector";
import { ResponseList } from "./evaluation/ResponseList";
import { EvaluationButton } from "./evaluation/EvaluationButton";

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

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
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

      if (!response.ok) {
        throw new Error("Failed to evaluate");
      }

      const data = await response.json();
      setResponses(data.responses);
    } catch (error) {
      console.error("Evaluation error:", error);
      // TODO: Add proper error handling UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="w-full space-y-6">
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

      <ResponseList responses={responses} />
    </form>
  );
}
