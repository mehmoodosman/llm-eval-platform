"use client";

import { Button } from "@/components/ui/button";
import { CreateExperimentDialog } from "./CreateExperimentDialog";

interface ExperimentListErrorProps {
  error: Error;
  onRetry: () => void;
}

export function ExperimentListError({
  error,
  onRetry,
}: ExperimentListErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-4 max-w-md text-center">
        <p className="font-medium mb-1">Failed to load experiments</p>
        <p className="text-sm text-red-400">
          {error.message || "An error occurred"}
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="border-white/10 text-white/80 hover:bg-slate-800/50 hover:border-white/20"
      >
        Try again
      </Button>
    </div>
  );
}

export function ExperimentListLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 bg-slate-800/50 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-96 bg-slate-800/30 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/50 border border-white/5"
          >
            <div className="space-y-4">
              <div>
                <div className="h-6 w-3/4 bg-slate-800/50 rounded-lg animate-pulse mb-2" />
                <div className="flex items-center gap-3">
                  <div className="h-6 w-24 bg-slate-800/30 rounded-full animate-pulse" />
                  <div className="h-4 w-4 bg-slate-800/20 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-slate-800/30 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-800/30 rounded-lg animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-800/30 rounded-lg animate-pulse" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-32 bg-slate-800/30 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-slate-800/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ExperimentListEmptyProps {
  onExperimentCreated: () => void;
}

export function ExperimentListEmpty({
  onExperimentCreated,
}: ExperimentListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-2xl border border-white/5 text-center mb-6 max-w-md">
        <h3 className="text-xl font-semibold text-white mb-2">
          No experiments yet
        </h3>
        <p className="text-white/60 mb-6">
          Create your first experiment to start evaluating your LLM models
        </p>
        <CreateExperimentDialog onExperimentCreated={onExperimentCreated} />
      </div>
    </div>
  );
}
