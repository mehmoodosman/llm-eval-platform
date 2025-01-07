"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface TestCase {
  id: string;
  userMessage: string;
  expectedOutput: string;
  metrics: string[];
  createdAt: string;
  results?: {
    id: string;
    response: string;
    exactMatchScore?: string;
    llmMatchScore?: string;
    cosineSimilarityScore?: string;
    metrics?: Record<string, number>;
    error?: string;
  }[];
}

interface TestCaseListProps {
  experimentId: string;
}

export function TestCaseList({ experimentId }: TestCaseListProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTestCases() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(
          `${baseUrl}/api/experiments/${experimentId}/test-cases`
        );
        if (!res.ok) throw new Error("Failed to fetch test cases");
        const data = await res.json();
        console.log("Fetched test cases:", JSON.stringify(data, null, 2));
        setTestCases(data);
      } catch (error) {
        console.error("Error fetching test cases:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestCases();
  }, [experimentId]);

  if (isLoading) {
    return <div className="text-sm text-white/40">Loading test cases...</div>;
  }

  if (testCases.length === 0) {
    return <div className="text-sm text-white/40">No test cases yet</div>;
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {testCases.map(testCase => (
          <Card key={testCase.id} className="bg-slate-900/50 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Test Case
                <span className="ml-2 text-xs text-white/40">
                  {formatDistanceToNow(new Date(testCase.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">
                  User Message
                </div>
                <div className="text-sm text-white/80">
                  {testCase.userMessage}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">
                  Expected Output
                </div>
                <div className="text-sm text-white/80">
                  {testCase.expectedOutput}
                </div>
              </div>
              <div className="flex gap-2">
                {testCase.metrics.map(metric => (
                  <div
                    key={metric}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-white/5 text-white/60"
                  >
                    {metric}
                  </div>
                ))}
              </div>

              {testCase.results && testCase.results.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="text-xs font-medium text-white/60">
                    Results
                  </div>
                  {testCase.results.map(result => (
                    <div
                      key={result.id}
                      className="space-y-4 p-4 rounded-lg bg-black/20"
                    >
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-white/60">
                          Response
                        </div>
                        <div className="text-sm text-white/80">
                          {result.response}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {result.exactMatchScore && (
                          <div>
                            <div className="text-xs font-medium text-white/60">
                              Exact Match
                            </div>
                            <div className="text-sm text-white/80">
                              {parseFloat(result.exactMatchScore).toFixed(2)}%
                            </div>
                          </div>
                        )}
                        {result.llmMatchScore && (
                          <div>
                            <div className="text-xs font-medium text-white/60">
                              LLM Match
                            </div>
                            <div className="text-sm text-white/80">
                              {parseFloat(result.llmMatchScore).toFixed(2)}%
                            </div>
                          </div>
                        )}
                        {result.cosineSimilarityScore && (
                          <div>
                            <div className="text-xs font-medium text-white/60">
                              Cosine Similarity
                            </div>
                            <div className="text-sm text-white/80">
                              {parseFloat(result.cosineSimilarityScore).toFixed(
                                2
                              )}
                              %
                            </div>
                          </div>
                        )}
                      </div>

                      {result.error && (
                        <div className="mt-4">
                          <div className="text-xs font-medium text-red-500">
                            Error
                          </div>
                          <div className="text-sm text-red-400">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
