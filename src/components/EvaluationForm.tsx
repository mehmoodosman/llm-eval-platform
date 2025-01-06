"use client";

import { useEvaluationStore } from "@/stores/evaluation-store";
import { TextAreaField } from "./evaluation/TextAreaField";
import { ModelSelector } from "./evaluation/ModelSelector";
import { ResponseList } from "./evaluation/ResponseList";
import { EvaluationButton } from "./evaluation/EvaluationButton";
import { MetricsSelector } from "./evaluation/MetricsSelector";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";

export function EvaluationForm() {
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
    toggleModel,
    toggleMetric,
  } = useEvaluationStore();

  const { isStreaming, handleSubmit, responses } = useEvaluationStream();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit({
      systemPrompt,
      userMessage,
      expectedOutput,
      selectedModels,
      selectedMetrics,
    });
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-6">
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

      <MetricsSelector
        selectedMetrics={selectedMetrics}
        onToggleMetric={toggleMetric}
      />

      <EvaluationButton isLoading={isLoading} onClick={onSubmit} />

      <ResponseList responses={responses} isStreaming={isStreaming} />
    </form>
  );
}
