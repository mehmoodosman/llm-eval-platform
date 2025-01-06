"use client";

import { useEffect, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { type Response, type ResponseListProps } from "@/types/evaluation";
import { ResponseHeader } from "./ResponseHeader";
import { ResponseMetrics } from "./ResponseMetrics";

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

  if (localResponses.length === 0) return null;

  return (
    <div className="mt-6 space-y-6">
      {localResponses.map((response, index) => (
        <ResponseItem
          key={index}
          response={response}
          isStreaming={isStreaming}
        />
      ))}
    </div>
  );
}
