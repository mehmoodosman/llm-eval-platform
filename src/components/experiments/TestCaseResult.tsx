import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { TestCase } from "@/types/experiments";

interface TestCaseResultProps {
  result: NonNullable<TestCase["results"]>[0];
}

export function TestCaseResult({ result }: TestCaseResultProps) {
  return (
    <div className="space-y-4 rounded-lg bg-black/20 p-4">
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-white/5 text-white/60 hover:bg-white/10"
        >
          {result.model.label}
        </Badge>
      </div>
      <div className="space-y-2">
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
            value={Number(result.cosineSimilarityScore) * 100}
          />
        )}
      </div>

      {result.error && (
        <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-4">
          <div className="text-xs font-medium text-red-500">Error</div>
          <div className="mt-1 text-sm text-red-400">{result.error}</div>
        </div>
      )}
    </div>
  );
}
