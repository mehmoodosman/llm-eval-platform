"use client";

import { EvaluationForm } from "../EvaluationForm";
import { useEvaluationStore } from "@/stores/evaluation-store";
import { useEffect } from "react";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";
import { TestCaseList } from "./TestCaseList";
import { ExperimentResults } from "./ExperimentResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExperimentTestCasesProps {
  experimentId: string;
  systemPrompt: string;
  models: Array<{
    id: string;
    value: string;
    label: string;
    category: string;
  }>;
}

export function ExperimentTestCases({
  experimentId,
  systemPrompt,
  models,
}: ExperimentTestCasesProps) {
  const {
    setSystemPrompt,
    setExperimentId,
    setSelectedModels,
    systemPrompt: currentSystemPrompt,
    userMessage,
    expectedOutput,
    selectedMetrics,
  } = useEvaluationStore();
  const { handleSubmit: handleEvaluationSubmit } = useEvaluationStream();

  // Pre-fill system prompt from experiment and set experiment ID
  useEffect(() => {
    setSystemPrompt(systemPrompt);
    setExperimentId(experimentId);
    setSelectedModels(models.map(m => m.value));
  }, [
    systemPrompt,
    experimentId,
    models,
    setSystemPrompt,
    setExperimentId,
    setSelectedModels,
  ]);

  const handleSubmit = async () => {
    await handleEvaluationSubmit({
      systemPrompt: currentSystemPrompt,
      userMessage,
      expectedOutput,
      selectedModels: models.map(m => m.value),
      selectedMetrics,
    });
    await useEvaluationStore.getState().saveTestCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <h2 className="text-lg font-medium text-white/80">Test Cases</h2>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="bg-slate-900/50 border border-white/5">
            <TabsTrigger value="add">Add Test Case</TabsTrigger>
            <TabsTrigger value="list">View Test Cases</TabsTrigger>
            <TabsTrigger value="results">View Results</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="add">
          <EvaluationForm onSubmit={handleSubmit} />
        </TabsContent>

        <TabsContent value="list">
          <TestCaseList experimentId={experimentId} />
        </TabsContent>

        <TabsContent value="results">
          <ExperimentResults experimentId={experimentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
