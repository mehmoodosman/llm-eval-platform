import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ExperimentResult {
  id: string;
  experimentId: string;
  modelId: string;
  testCaseId: string;
  response: string;
  exactMatchScore?: string;
  llmMatchScore?: string;
  cosineSimilarityScore?: string;
  metrics?: Record<string, number>;
  error?: string;
  model: {
    id: string;
    value: string;
    label: string;
    category: string;
  };
}

interface TestCase {
  id: string;
  userMessage: string;
  expectedOutput: string;
  metrics: string[];
}

interface Model {
  id: string;
  value: string;
  label: string;
  category: string;
}

interface ExperimentResultsProps {
  experimentId: string;
}

export function ExperimentResults({ experimentId }: ExperimentResultsProps) {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [testCases, setTestCases] = useState<Record<string, TestCase>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching results for experiment:", experimentId);
        // Fetch results
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resultsResponse = await fetch(
          `${baseUrl}/api/experiment-results?experimentId=${experimentId}`
        );
        if (!resultsResponse.ok) throw new Error("Failed to fetch results");
        const resultsData = await resultsResponse.json();
        console.log("Fetched results:", resultsData);
        setResults(resultsData);

        // Fetch test cases
        const testCasesResponse = await fetch(
          `${baseUrl}/api/experiments/${experimentId}/test-cases`
        );
        if (!testCasesResponse.ok)
          throw new Error("Failed to fetch test cases");
        const testCasesData = await testCasesResponse.json();
        console.log("Fetched test cases:", testCasesData);

        // Convert array to record for easy lookup
        const testCasesRecord = testCasesData.reduce(
          (acc: Record<string, TestCase>, testCase: TestCase) => {
            acc[testCase.id] = testCase;
            return acc;
          },
          {}
        );
        console.log("Processed test cases:", testCasesRecord);
        setTestCases(testCasesRecord);
      } catch (err) {
        console.error("Error in ExperimentResults:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [experimentId]);

  if (isLoading) {
    return <div className="text-sm text-white/40">Loading results...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">Error: {error}</div>;
  }

  // Group results by model
  const resultsByModel = results.reduce(
    (acc, result) => {
      if (!acc[result.modelId]) {
        acc[result.modelId] = [];
      }
      acc[result.modelId].push(result);
      return acc;
    },
    {} as Record<string, ExperimentResult[]>
  );

  console.log("Results grouped by model:", resultsByModel);

  // Calculate average scores for each model
  const modelAverages = Object.entries(resultsByModel)
    .map(([modelId, modelResults]) => {
      const validResults = modelResults.filter(r => !r.error);
      const totalResults = validResults.length;

      if (totalResults === 0) return null;

      // Get the first result with model information
      const modelInfo = modelResults.find(r => r.model)?.model;
      if (!modelInfo) return null;

      const averages = {
        modelId,
        model: modelInfo,
        totalTests: modelResults.length,
        successfulTests: validResults.length,
        exactMatch:
          validResults.reduce(
            (sum, r) =>
              sum + (r.exactMatchScore ? parseFloat(r.exactMatchScore) : 0),
            0
          ) / totalResults,
        llmMatch:
          validResults.reduce(
            (sum, r) =>
              sum + (r.llmMatchScore ? parseFloat(r.llmMatchScore) : 0),
            0
          ) / totalResults,
        cosineSimilarity:
          validResults.reduce(
            (sum, r) =>
              sum +
              (r.cosineSimilarityScore
                ? parseFloat(r.cosineSimilarityScore)
                : 0),
            0
          ) / totalResults,
        metrics: {} as Record<string, number>,
      };

      // Calculate average for each metric
      const allMetrics = new Set<string>();
      validResults.forEach(r => {
        if (r.metrics) {
          Object.keys(r.metrics).forEach(k => allMetrics.add(k));
        }
      });

      allMetrics.forEach(metric => {
        const validMetricResults = validResults.filter(
          r => r.metrics?.[metric] !== undefined
        );
        if (validMetricResults.length > 0) {
          averages.metrics[metric] =
            validMetricResults.reduce(
              (sum, r) => sum + (r.metrics?.[metric] || 0),
              0
            ) / validMetricResults.length;
        }
      });

      return averages;
    })
    .filter(Boolean);

  console.log("Calculated model averages:", modelAverages);

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6">
        {modelAverages.map(modelAvg => (
          <Card
            key={modelAvg?.modelId}
            className="bg-slate-900/50 border-white/5"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white/90">
                    {modelAvg?.model.label}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/5 text-white/60">
                    {modelAvg?.model.value}
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  {modelAvg?.successfulTests} / {modelAvg?.totalTests} tests
                  passed
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-medium text-white/60 mb-1">
                    Exact Match
                  </div>
                  <div className="text-2xl font-semibold text-white/90">
                    {modelAvg && ((modelAvg.exactMatch || 0) * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-white/60 mb-1">
                    LLM Match
                  </div>
                  <div className="text-2xl font-semibold text-white/90">
                    {modelAvg && ((modelAvg.llmMatch || 0) * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-white/60 mb-1">
                    Cosine Similarity
                  </div>
                  <div className="text-2xl font-semibold text-white/90">
                    {modelAvg &&
                      ((modelAvg.cosineSimilarity || 0) * 100).toFixed(2)}
                    %
                  </div>
                </div>
              </div>

              {Object.keys(modelAvg?.metrics || {}).length > 0 && (
                <>
                  <Separator className="bg-white/5" />
                  <div>
                    <div className="text-xs font-medium text-white/60 mb-4">
                      Additional Metrics
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(modelAvg?.metrics || {}).map(
                        ([metric, score]) => (
                          <div key={metric}>
                            <div className="text-xs font-medium text-white/60 mb-1">
                              {metric}
                            </div>
                            <div className="text-2xl font-semibold text-white/90">
                              {(score * 100).toFixed(2)}%
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {modelAverages.length === 0 && (
          <div className="text-sm text-white/40">No results available</div>
        )}
      </div>
    </ScrollArea>
  );
}
