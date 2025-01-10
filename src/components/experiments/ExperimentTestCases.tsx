"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Play, Loader2 } from "lucide-react";
import { useEvaluationStore } from "@/stores/evaluation-store";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";
import { useTestCaseOperations } from "@/hooks/useTestCaseOperations";
import { ExperimentTestCasesProps } from "@/types/experiments";
import { EvaluationForm } from "../EvaluationForm";
import { TestCaseList } from "./TestCaseList";
import { ExperimentResults } from "./ExperimentResults";
import { TestCaseLoadingSkeleton } from "./TestCaseLoadingSkeleton";

export function ExperimentTestCases({
  experimentId,
  systemPrompt,
  models,
}: ExperimentTestCasesProps) {
  const [activeTab, setActiveTab] = useState("add");

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

  const {
    uploadedTestCases,
    isEvaluating,
    isUploading,
    handleFileUpload,
    handleBulkEvaluation,
  } = useTestCaseOperations(experimentId);

  // Initialize store with experiment data
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

  const handleSingleTestCaseSubmit = async () => {
    await handleEvaluationSubmit({
      systemPrompt: currentSystemPrompt,
      userMessage,
      expectedOutput,
      selectedModels: models.map(m => m.value),
      selectedMetrics,
    });
    await useEvaluationStore.getState().saveTestCase();
  };

  const handleFileUploadWithTabChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await handleFileUpload(event, () => setActiveTab("list"));
  };

  const handleBulkEvaluationWithTabChange = async () => {
    await handleBulkEvaluation(
      models.map(m => m.value),
      () => setActiveTab("results")
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <h2 className="text-lg font-medium text-white/80">Test Cases</h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex justify-center items-center gap-4">
          <TabsList className="bg-slate-900/50 border border-white/5">
            <TabsTrigger value="add">Add Test Case</TabsTrigger>
            <TabsTrigger value="list">View Test Cases</TabsTrigger>
            <TabsTrigger value="results">View Results</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center justify-center gap-2 h-8 px-3 text-xs rounded-md bg-slate-900/50 border border-white/5 text-white/80 hover:text-white hover:bg-slate-900/70 cursor-pointer transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUploadWithTabChange}
                className="hidden"
                aria-label="Upload JSON test cases"
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload JSON
                </>
              )}
            </label>

            {uploadedTestCases.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkEvaluationWithTabChange}
                disabled={isEvaluating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Evaluate All
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="add">
          <EvaluationForm onSubmit={handleSingleTestCaseSubmit} />
        </TabsContent>

        <TabsContent value="list">
          {uploadedTestCases.length > 0 ? (
            isEvaluating ? (
              <TestCaseLoadingSkeleton testCases={uploadedTestCases} />
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-white/60 mb-4">
                  {uploadedTestCases.length} test cases uploaded
                </div>
                <div className="grid gap-4">
                  {uploadedTestCases.map((testCase, index) => (
                    <Card
                      key={index}
                      className="p-4 bg-slate-900/50 border-white/5"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-medium text-white/60 mb-2">
                            User Message
                          </div>
                          <div className="text-sm text-white/80 bg-black/20 rounded-lg p-3">
                            {testCase.userMessage}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white/60 mb-2">
                            Expected Output
                          </div>
                          <div className="text-sm text-white/80 bg-black/20 rounded-lg p-3">
                            {testCase.expectedOutput}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ) : (
            <TestCaseList experimentId={experimentId} />
          )}
        </TabsContent>

        <TabsContent value="results">
          <ExperimentResults experimentId={experimentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
