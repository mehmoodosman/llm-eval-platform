"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error("Failed to fetch test cases");
    return res.json();
  });

export function TestCaseList({ experimentId }: TestCaseListProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const {
    data: testCases,
    error,
    isLoading,
  } = useSWR<TestCase[]>(
    `${baseUrl}/api/experiments/${experimentId}/test-cases`,
    fetcher
  );

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-4">
        <p className="text-sm text-red-400">Error loading test cases</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="bg-slate-900/50 border-white/5">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!testCases?.length) {
    return (
      <div className="rounded-lg border border-white/5 bg-slate-900/50 p-8 text-center">
        <p className="text-sm text-white/40">No test cases available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {testCases.map(testCase => (
          <Card
            key={testCase.id}
            className="bg-slate-900/50 border-white/5 transition-all hover:bg-slate-900/70"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
                    <span className="text-xs">#{testCase.id.slice(-4)}</span>
                  </div>
                  <span className="text-xs text-white/40">
                    {formatDistanceToNow(new Date(testCase.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-white/60">
                    User Message
                  </div>
                  <div className="rounded-lg bg-black/20 p-3 text-sm text-white/80">
                    {testCase.userMessage}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-white/60">
                    Expected Output
                  </div>
                  <div className="rounded-lg bg-black/20 p-3 text-sm text-white/80">
                    {testCase.expectedOutput}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-white/60">
                  Selected Metrics
                </div>
                <div className="flex flex-wrap gap-2">
                  {testCase.metrics.map(metric => (
                    <HoverCard key={metric}>
                      <HoverCardTrigger>
                        <Badge
                          variant="secondary"
                          className="bg-white/5 text-white/60 hover:bg-white/10"
                        >
                          {metric}
                        </Badge>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{metric}</h4>
                          <p className="text-sm text-white/60">
                            Metric description could go here
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </div>

              {testCase.results && testCase.results.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-white/60">
                    Results
                  </div>
                  {testCase.results.map(result => (
                    <div
                      key={result.id}
                      className="space-y-4 rounded-lg bg-black/20 p-4"
                    >
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-white/60">
                          Response
                        </div>
                        <div className="rounded-lg bg-black/20 p-3 text-sm text-white/80">
                          {result.response}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {result.exactMatchScore && (
                          <MetricCard
                            label="Exact Match"
                            value={parseFloat(result.exactMatchScore)}
                          />
                        )}
                        {result.llmMatchScore && (
                          <MetricCard
                            label="LLM Match"
                            value={parseFloat(result.llmMatchScore)}
                          />
                        )}
                        {result.cosineSimilarityScore && (
                          <MetricCard
                            label="Cosine Similarity"
                            value={parseFloat(result.cosineSimilarityScore)}
                          />
                        )}
                      </div>

                      {result.metrics &&
                        Object.keys(result.metrics).length > 0 && (
                          <div>
                            <div className="mb-2 text-xs font-medium text-white/60">
                              Evaluation Metrics
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(result.metrics).map(
                                ([metric, score]) => (
                                  <MetricCard
                                    key={metric}
                                    label={metric}
                                    value={
                                      typeof score === "number"
                                        ? score * 100
                                        : 0
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {result.error && (
                        <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-4">
                          <div className="text-xs font-medium text-red-500">
                            Error
                          </div>
                          <div className="mt-1 text-sm text-red-400">
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

interface MetricCardProps {
  label: string;
  value: number;
}

function MetricCard({ label, value }: MetricCardProps) {
  const percentage = value.toFixed(2);
  const color =
    value >= 90
      ? "text-green-400"
      : value >= 70
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="rounded-lg bg-black/20 p-3">
      <div className="text-xs font-medium text-white/60">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", color)}>
        {percentage}%
      </div>
    </div>
  );
}
