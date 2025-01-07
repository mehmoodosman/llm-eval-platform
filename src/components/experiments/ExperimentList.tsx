"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { CreateExperimentDialog } from "./CreateExperimentDialog";
import { useRouter } from "next/navigation";

interface Model {
  id: string;
  value: string;
  label: string;
  category: string;
}

interface Experiment {
  id: string;
  name: string;
  models: Model[];
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
  testCaseCount: number;
}

export function ExperimentList() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchExperiments = async () => {
    try {
      const response = await fetch("/api/experiments");
      if (!response.ok) throw new Error("Failed to fetch experiments");
      const data = await response.json();
      setExperiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  if (isLoading) {
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-4 max-w-md text-center">
          <p className="font-medium mb-1">Failed to load experiments</p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <Button
          onClick={() => {
            setIsLoading(true);
            setError(null);
            fetchExperiments();
          }}
          variant="outline"
          className="border-white/10 text-white/80 hover:bg-slate-800/50 hover:border-white/20"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-2xl border border-white/5 text-center mb-6 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2">
            No experiments yet
          </h3>
          <p className="text-white/60 mb-6">
            Create your first experiment to start evaluating your LLM models
          </p>
          <CreateExperimentDialog onExperimentCreated={fetchExperiments} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Experiments</h1>
        <p className="text-sm text-white/60">
          Create and manage your LLM evaluation experiments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map(experiment => (
          <Card
            key={experiment.id}
            className="relative p-6 bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-white/5 hover:border-white/10 transition-all duration-300 group overflow-hidden hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer"
            onClick={() => router.push(`/experiments/${experiment.id}`)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-white/90 mb-2 group-hover:text-white transition-colors line-clamp-1">
                  {experiment.name}
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {experiment.models.map(model => (
                      <span
                        key={model.id}
                        className="px-2 py-1 rounded-full bg-slate-800 text-white/70 font-mono text-xs group-hover:bg-slate-700/70 transition-colors"
                        title={`${model.category} - ${model.label}`}
                      >
                        {model.value}
                      </span>
                    ))}
                  </div>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60">
                    {experiment.testCaseCount}{" "}
                    {experiment.testCaseCount === 1
                      ? "test case"
                      : "test cases"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-white/60 line-clamp-2 group-hover:text-white/70 transition-colors">
                {experiment.systemPrompt}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-white/40">
                  Created{" "}
                  {formatDistanceToNow(new Date(experiment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* {experiments.length > 0 && (
        <div className="flex justify-center">
          <CreateExperimentDialog onExperimentCreated={fetchExperiments} />
        </div>
      )} */}
    </div>
  );
}
