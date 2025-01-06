"use client";

import { type TimingInfo, type StreamingMetrics } from "@/types/evaluation";

interface ResponseHeaderProps {
  model: string;
  isStreaming?: boolean;
  metrics?: TimingInfo & {
    streaming?: StreamingMetrics;
  };
}

function formatNumber(num: number): string {
  return num.toFixed(2);
}

export function ResponseHeader({
  model,
  isStreaming,
  metrics,
}: ResponseHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/5">
      <div className="flex items-center space-x-3">
        <h3 className="text-sm font-semibold text-white/90">{model}</h3>
        {isStreaming && (
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-500/90">Live</span>
          </div>
        )}
      </div>
      {metrics && (
        <div className="flex items-center space-x-6 text-sm text-white/70">
          {metrics.streaming && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-5 bg-blue-500/30 rounded-full" />
                <span className="tabular-nums">
                  {formatNumber(metrics.streaming.tokensPerSecond)} t/s
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-5 bg-purple-500/30 rounded-full" />
                <span className="tabular-nums">
                  {metrics.streaming.totalTokens} tokens
                </span>
              </div>
            </>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-1 h-5 bg-white/20 rounded-full" />
            <span className="tabular-nums">
              {formatNumber(metrics.duration)}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
