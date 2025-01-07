"use client";

import { useEvaluationStore } from "@/stores/evaluation-store";
import { TextAreaField } from "./evaluation/TextAreaField";
import { ResponseList } from "./evaluation/ResponseList";
import { EvaluationButton } from "./evaluation/EvaluationButton";
import { MetricsSelector } from "./evaluation/MetricsSelector";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";

interface EvaluationFormProps {
  onSubmit: () => Promise<void>;
}

export function EvaluationForm({ onSubmit }: EvaluationFormProps) {
  const {
    systemPrompt,
    userMessage,
    expectedOutput,
    selectedModels,
    selectedMetrics,
    isLoading,
    setSystemPrompt,
    setUserMessage,
    setExpectedOutput,
    toggleMetric,
  } = useEvaluationStore();

  const {
    isStreaming,
    responses,
    handleSubmit: handleEvaluationSubmit,
  } = useEvaluationStream();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleEvaluationSubmit({
        systemPrompt,
        userMessage,
        expectedOutput,
        selectedModels,
        selectedMetrics,
      });
      await onSubmit();
    } catch (error) {
      console.error("Error during evaluation:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
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

      <MetricsSelector
        selectedMetrics={selectedMetrics}
        onToggleMetric={toggleMetric}
      />

      <EvaluationButton isLoading={isLoading} onClick={handleSubmit} />

      <ResponseList responses={responses} isStreaming={isStreaming} />
    </form>
  );
}
