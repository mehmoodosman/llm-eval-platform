"use client";

import { EvaluationForm } from "../EvaluationForm";
import { useEvaluationStore } from "@/stores/evaluation-store";
import { useEffect, useState } from "react";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";
import { TestCaseList } from "./TestCaseList";
import { ExperimentResults } from "./ExperimentResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

interface TestCase {
  id?: string;
  userMessage: string;
  expectedOutput: string;
  metrics?: string[];
}

function TestCaseLoadingSkeleton({ testCases }: { testCases: TestCase[] }) {
  const selectedModels = useEvaluationStore(state => state.selectedModels);

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/60 mb-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
        <span>
          Evaluating test cases against {selectedModels.length} models...
        </span>
      </div>
      <div className="grid gap-4">
        {testCases.map((testCase, index) => (
          <Card key={index} className="p-4 bg-slate-900/50 border-white/5">
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
              <div className="pt-2">
                <div className="text-xs font-medium text-white/60 mb-2">
                  Evaluation Progress
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {selectedModels.map(model => (
                    <div key={model} className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">{model}</div>
                      <Skeleton className="h-2 bg-blue-500/20 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("add");
  const [uploadedTestCases, setUploadedTestCases] = useState<TestCase[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Add SWR hooks for test cases and results
  const { mutate: mutateTestCases } = useSWR(
    `${baseUrl}/api/experiments/${experimentId}/test-cases`
  );
  const { mutate: mutateResults } = useSWR(
    `${baseUrl}/api/experiment-results?experimentId=${experimentId}`
  );

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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const content = await file.text();
      const testCases = JSON.parse(content);

      if (!Array.isArray(testCases)) {
        throw new Error("JSON must be an array of test cases");
      }

      // Validate structure
      const isValid = testCases.every(
        tc =>
          typeof tc === "object" &&
          tc !== null &&
          typeof tc.userMessage === "string" &&
          typeof tc.expectedOutput === "string"
      );

      if (!isValid) {
        throw new Error(
          "Each test case must have userMessage and expectedOutput as strings"
        );
      }

      // Upload test cases
      const response = await fetch(
        `${baseUrl}/api/experiments/${experimentId}/test-cases/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ testCases }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload test cases");
      }

      const result = await response.json();

      // Store uploaded test cases
      setUploadedTestCases(result.testCases);

      // Refresh data
      await mutateTestCases();

      toast({
        title: "Success",
        description: `Uploaded ${result.count} test cases successfully. Click Evaluate to start testing.`,
      });

      // Switch to list view
      setActiveTab("list");

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading test cases:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload test cases",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkEvaluation = async () => {
    if (!uploadedTestCases.length) {
      toast({
        title: "Error",
        description: "No test cases to evaluate",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    try {
      for (const testCase of uploadedTestCases) {
        await handleEvaluationSubmit({
          systemPrompt: currentSystemPrompt,
          userMessage: testCase.userMessage,
          expectedOutput: testCase.expectedOutput,
          selectedModels: models.map(m => m.value),
          selectedMetrics,
        });
      }

      // Refresh results
      await mutateResults();

      // Switch to results view
      setActiveTab("results");

      toast({
        title: "Success",
        description: "All test cases have been evaluated",
      });
    } catch (error) {
      console.error("Error evaluating test cases:", error);
      toast({
        title: "Error",
        description: "Failed to evaluate all test cases",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
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
                onChange={handleFileUpload}
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
                onClick={handleBulkEvaluation}
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
          <EvaluationForm onSubmit={handleSubmit} />
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
