import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ExperimentResult {
  id: string;
  experimentId: string;
  testCaseId: string;
  response: string;
  exactMatchScore?: string;
  llmMatchScore?: string;
  cosineSimilarityScore?: string;
  metrics?: Record<string, number>;
  error?: string;
}

interface TestCase {
  id: string;
  userMessage: string;
  expectedOutput: string;
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
        // Fetch results
        const resultsResponse = await fetch(
          `/api/experiment-results?experimentId=${experimentId}`
        );
        if (!resultsResponse.ok) throw new Error("Failed to fetch results");
        const resultsData = await resultsResponse.json();
        setResults(resultsData);

        // Fetch test cases
        const testCasesResponse = await fetch(
          `/api/test-cases?experimentId=${experimentId}`
        );
        if (!testCasesResponse.ok)
          throw new Error("Failed to fetch test cases");
        const testCasesData = await testCasesResponse.json();

        // Convert array to record for easy lookup
        const testCasesRecord = testCasesData.reduce(
          (acc: Record<string, TestCase>, testCase: TestCase) => {
            acc[testCase.id] = testCase;
            return acc;
          },
          {}
        );
        setTestCases(testCasesRecord);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [experimentId]);

  if (isLoading) {
    return <div>Loading results...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {results.map(result => {
          const testCase = testCases[result.testCaseId];
          if (!testCase) return null;

          return (
            <Card key={result.id} className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Test Case</h3>
                  <p className="text-sm text-gray-500">
                    {testCase.userMessage}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">Expected Output</h4>
                  <p className="text-sm text-gray-500">
                    {testCase.expectedOutput}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">Response</h4>
                  <p className="text-sm text-gray-500">{result.response}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  {result.exactMatchScore && (
                    <div>
                      <h4 className="text-sm font-medium">Exact Match</h4>
                      <p className="text-lg">
                        {parseFloat(result.exactMatchScore).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  {result.llmMatchScore && (
                    <div>
                      <h4 className="text-sm font-medium">LLM Match</h4>
                      <p className="text-lg">
                        {parseFloat(result.llmMatchScore).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  {result.cosineSimilarityScore && (
                    <div>
                      <h4 className="text-sm font-medium">Cosine Similarity</h4>
                      <p className="text-lg">
                        {parseFloat(result.cosineSimilarityScore).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>

                {result.error && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-500">Error</h4>
                    <p className="text-sm text-red-400">{result.error}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
