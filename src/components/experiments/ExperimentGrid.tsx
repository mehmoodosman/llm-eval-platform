"use client";

import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Experiment } from "@/types/experiments";

interface ExperimentGridProps {
  experiments: Experiment[];
  onDelete?: (id: string) => void;
}

export function ExperimentGrid({ experiments, onDelete }: ExperimentGridProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {experiments.map(experiment => (
        <Card
          key={experiment.id}
          className="relative p-6 bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-white/5 hover:border-white/10 transition-all duration-300 group overflow-hidden hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer"
          onClick={() => router.push(`/experiments/${experiment.id}`)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white/90 mb-2 group-hover:text-white transition-colors line-clamp-1">
                {experiment.name}
              </h3>
              <DropdownMenu>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-slate-900 border-slate-800"
                  onClick={e => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    className="text-white/80 focus:bg-slate-800 focus:text-white"
                    onClick={() => router.push(`/experiments/${experiment.id}`)}
                  >
                    View Details
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-red-400 focus:bg-red-950 focus:text-red-400"
                      onClick={() => onDelete(experiment.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                {experiment.testCaseCount === 1 ? "test case" : "test cases"}
              </span>
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
              <span className="text-blue-400 group-hover:text-blue-300">
                View Details →
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
