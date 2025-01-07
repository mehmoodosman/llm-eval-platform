import { EvaluationMetric } from "@/types/evaluation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricsSelectorProps {
  selectedMetrics: EvaluationMetric[];
  onToggleMetric: (metric: EvaluationMetric) => void;
}

const METRICS_INFO = {
  [EvaluationMetric.EXACT_MATCH]: {
    label: "Exact Match",
    description: "Checks if the output exactly matches the expected result",
    tooltip: "Perfect string matching comparison between outputs",
  },
  [EvaluationMetric.COSINE_SIMILARITY]: {
    label: "Cosine Similarity",
    description: "Measures semantic similarity between outputs",
    tooltip: "Vector-based semantic similarity scoring from 0 to 1",
  },
  [EvaluationMetric.LLM_JUDGE]: {
    label: "LLM Judge",
    description: "Uses an LLM to evaluate output quality",
    tooltip: "AI-powered evaluation of response quality and correctness",
  },
};

export function MetricsSelector({
  selectedMetrics,
  onToggleMetric,
}: MetricsSelectorProps) {
  return (
    <div className="space-y-4 p-4 rounded-lg bg-card border">
      <h3 className="text-lg font-semibold text-card-foreground">
        Evaluation Metrics
      </h3>
      <div className="grid gap-4">
        <TooltipProvider>
          {Object.values(EvaluationMetric).map(metric => {
            const isSelected = selectedMetrics.includes(metric);
            const info = METRICS_INFO[metric];

            return (
              <Tooltip key={metric}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => onToggleMetric(metric)}
                    className={cn(
                      "group flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                      "hover:bg-accent/50",
                      isSelected && "bg-accent/30"
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isSelected ? 1 : 0,
                          opacity: isSelected ? 1 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className="h-3 w-3 rounded-sm bg-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium leading-none">
                        {info.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {info.description}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {info.tooltip}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
