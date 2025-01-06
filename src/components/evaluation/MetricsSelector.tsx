import { EvaluationMetric } from "@/types/evaluation";
import { Checkbox } from "./Checkbox";

interface MetricsSelectorProps {
  selectedMetrics: EvaluationMetric[];
  onToggleMetric: (metric: EvaluationMetric) => void;
}

const METRIC_LABELS = {
  [EvaluationMetric.EXACT_MATCH]: "Exact Match",
  [EvaluationMetric.COSINE_SIMILARITY]: "Cosine Similarity",
  [EvaluationMetric.LLM_JUDGE]: "LLM Judge",
};

export function MetricsSelector({
  selectedMetrics,
  onToggleMetric,
}: MetricsSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Evaluation Metrics</label>
      <div className="flex flex-wrap gap-4">
        {Object.values(EvaluationMetric).map(metric => (
          <Checkbox
            key={metric}
            label={METRIC_LABELS[metric]}
            checked={selectedMetrics.includes(metric)}
            onCheckedChange={() => onToggleMetric(metric)}
          />
        ))}
      </div>
    </div>
  );
}
