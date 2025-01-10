import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvaluationStore } from "@/stores/evaluation-store";
import { TestCase } from "@/types/experiments";

interface TestCaseLoadingSkeletonProps {
  testCases: TestCase[];
}

export function TestCaseLoadingSkeleton({
  testCases,
}: TestCaseLoadingSkeletonProps) {
  const selectedModels = useEvaluationStore(state => state.selectedModels);

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/60 mb-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
        <span>
          Evaluating test cases against {selectedModels.length} models...
        </span>
      </div>
      <div className="grid gap-4">
        {testCases.map((testCase, index) => (
          <Card key={index} className="p-4 bg-slate-900/50 border-white/5">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-white/60 mb-2">
                  User Message
                </div>
                <div className="text-sm text-white/80 bg-black/20 rounded-lg p-3">
                  {testCase.userMessage}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-white/60 mb-2">
                  Expected Output
                </div>
                <div className="text-sm text-white/80 bg-black/20 rounded-lg p-3">
                  {testCase.expectedOutput}
                </div>
              </div>
              <div className="pt-2">
                <div className="text-xs font-medium text-white/60 mb-2">
                  Evaluation Progress
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {selectedModels.map(model => (
                    <div key={model} className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">{model}</div>
                      <Skeleton className="h-2 bg-blue-500/20 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
