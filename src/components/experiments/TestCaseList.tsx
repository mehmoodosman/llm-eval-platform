"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTestCases } from "@/hooks/useTestCases";
import { TestCaseResult } from "./TestCaseResult";

interface TestCaseListProps {
  experimentId: string;
}

export function TestCaseList({ experimentId }: TestCaseListProps) {
  const { testCases, error, isLoading } = useTestCases(experimentId);

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
                  <div className="flex h-7 w-fit min-w-[28px] items-center justify-center rounded-full bg-white/10 px-2 py-1">
                    <span className="text-sm font-medium text-white/70">
                      #{testCase.id.slice(-4)}
                    </span>
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
                    <TestCaseResult key={result.id} result={result} />
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
