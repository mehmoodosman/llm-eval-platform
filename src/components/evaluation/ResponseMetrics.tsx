"use client";

import { type StreamingMetrics, type TimingInfo } from "@/types/evaluation";

interface ResponseMetricsProps {
  metrics: TimingInfo & {
    streaming?: StreamingMetrics;
  };
}

function formatNumber(num: number): string {
  return num.toFixed(2);
}

export function ResponseMetrics({ metrics }: ResponseMetricsProps) {
  if (!metrics.streaming) return null;

  return (
    <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02]">
      <div className="grid grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <div className="text-white/50 text-xs font-medium">First Token</div>
          <div className="font-semibold text-white/90 tabular-nums">
            {formatNumber(metrics.streaming.timeToFirstToken)}ms
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-white/50 text-xs font-medium">Speed</div>
          <div className="font-semibold text-white/90 tabular-nums">
            {formatNumber(metrics.streaming.tokensPerSecond)} t/s
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-white/50 text-xs font-medium">Total Time</div>
          <div className="font-semibold text-white/90 tabular-nums">
            {formatNumber(metrics.duration)}ms
          </div>
        </div>
      </div>
    </div>
  );
}
