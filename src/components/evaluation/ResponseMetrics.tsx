"use client";

import { type TimingInfo, EvaluationMetric } from "@/types/evaluation";

interface ResponseMetricsProps {
  metrics: TimingInfo;
}

function formatNumber(num: number): string {
  return num.toFixed(2);
}

function formatMetricLabel(metric: EvaluationMetric): string {
  switch (metric) {
    case EvaluationMetric.EXACT_MATCH:
      return "Exact Match";
    case EvaluationMetric.COSINE_SIMILARITY:
      return "Cosine Similarity";
    case EvaluationMetric.LLM_JUDGE:
      return "LLM Judge";
    default:
      return metric;
  }
}

export function ResponseMetrics({ metrics }: ResponseMetricsProps) {
  const hasStreamingMetrics = metrics.streaming !== undefined;
  const hasEvaluationMetrics =
    metrics.evaluation !== undefined &&
    Object.keys(metrics.evaluation).length > 0;

  if (!hasStreamingMetrics && !hasEvaluationMetrics) return null;

  return (
    <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02]">
      {hasStreamingMetrics && metrics.streaming && (
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
      )}

      {hasEvaluationMetrics && metrics.evaluation && (
        <div
          className={`grid grid-cols-3 gap-6 text-sm ${hasStreamingMetrics ? "mt-3 pt-3 border-t border-white/5" : ""}`}
        >
          {(
            Object.entries(metrics.evaluation) as [EvaluationMetric, number][]
          ).map(([metric, score]) => (
            <div key={metric} className="space-y-1">
              <div className="text-white/50 text-xs font-medium">
                {formatMetricLabel(metric)}
              </div>
              <div className="font-semibold text-white/90 tabular-nums">
                {formatNumber(score)} / 1.0
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
