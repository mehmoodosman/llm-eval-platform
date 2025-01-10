import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TestCase } from "@/types/experiments";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";
import { useEvaluationStore } from "@/stores/evaluation-store";
import useSWR from "swr";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function useTestCaseOperations(experimentId: string) {
  const [uploadedTestCases, setUploadedTestCases] = useState<TestCase[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { handleSubmit: handleEvaluationSubmit } = useEvaluationStream();
  const { systemPrompt: currentSystemPrompt, selectedMetrics } =
    useEvaluationStore();

  const { mutate: mutateTestCases } = useSWR(
    `${baseUrl}/api/experiments/${experimentId}/test-cases`
  );
  const { mutate: mutateResults } = useSWR(
    `${baseUrl}/api/experiment-results?experimentId=${experimentId}`
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess?: () => void
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
      setUploadedTestCases(result.testCases);
      await mutateTestCases();

      toast({
        title: "Success",
        description: `Uploaded ${result.count} test cases successfully. Click Evaluate to start testing.`,
        variant: "success",
      });

      onSuccess?.();
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

  const handleBulkEvaluation = async (
    selectedModels: string[],
    onSuccess?: () => void
  ) => {
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
          selectedModels,
          selectedMetrics,
        });
      }

      await mutateResults();

      toast({
        title: "Success",
        description: "All test cases have been evaluated",
        variant: "success",
      });

      onSuccess?.();
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

  return {
    uploadedTestCases,
    isEvaluating,
    isUploading,
    handleFileUpload,
    handleBulkEvaluation,
  };
}
