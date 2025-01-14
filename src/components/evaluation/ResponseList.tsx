"use client";

import { useEffect, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { type Response, type ResponseListProps } from "@/types/evaluation";
import { ResponseHeader } from "./ResponseHeader";
import { ResponseMetrics } from "./ResponseMetrics";
import { Card } from "@/components/ui/card";
import { MetricsBarGraph } from "./MetricsBarGraph";
import { useEvaluationStore } from "@/stores/evaluation-store";
import { Loader2 } from "lucide-react";

function ResponseListLoading() {
  const selectedModels = useEvaluationStore(state => state.selectedModels);

  return (
    <div className="mt-6 space-y-6">
      {selectedModels.map(model => (
        <div
          key={model}
          className={cn(
            "overflow-hidden rounded-xl bg-black/40 border backdrop-blur-sm transition-all duration-200",
            "border-white/20 shadow-lg"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-white/5">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-white/90">{model}</h3>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-500/90">
                  Evaluating
                </span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                <p className="text-sm text-white/40">Generating response...</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ResponseItem = memo(function ResponseItem({
  response,
  isStreaming,
}: {
  response: Response;
  isStreaming?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-black/40 border backdrop-blur-sm transition-all duration-200",
        isStreaming ? "border-white/20 shadow-lg" : "border-white/10",
        response.error ? "border-red-500/20" : ""
      )}
    >
      <ResponseHeader
        model={response.model}
        isStreaming={isStreaming}
        metrics={response.metrics}
      />

      <div className="p-4">
        {response.error ? (
          <div className="flex items-center space-x-2 text-red-400">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            <p className="text-sm">{response.error}</p>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {response.response}
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-white/50 animate-pulse" />
              )}
            </p>
          </div>
        )}
      </div>

      {response.metrics && <ResponseMetrics metrics={response.metrics} />}
    </div>
  );
});

export function ResponseList({ responses, isStreaming }: ResponseListProps) {
  const [localResponses, setLocalResponses] = useState<Response[]>([]);

  useEffect(() => {
    setLocalResponses(responses);
  }, [responses]);

  // Show loading state when streaming starts but no responses yet
  if (isStreaming && localResponses.length === 0) {
    return <ResponseListLoading />;
  }

  if (localResponses.length === 0) return null;

  // Check if any response has metrics
  const hasMetrics = localResponses.some(
    response => response.metrics?.evaluation
  );

  return (
    <div className="mt-6 space-y-6">
      {localResponses.map((response, index) => (
        <ResponseItem
          key={index}
          response={response}
          isStreaming={isStreaming}
        />
      ))}

      {/* Comparison Bar Graph */}
      {hasMetrics && (
        <Card className="p-6 bg-black/40 border-white/10">
          <h3 className="text-sm font-medium text-white/80 mb-4">
            Model Comparison
          </h3>
          <MetricsBarGraph
            responses={localResponses.map(r => ({
              model: r.model,
              metrics: r.metrics,
            }))}
          />
        </Card>
      )}
    </div>
  );
}
