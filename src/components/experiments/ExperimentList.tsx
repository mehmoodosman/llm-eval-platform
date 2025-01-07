"use client";

import { useState } from "react";
import useSWR from "swr";
import { Grid, List, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateExperimentDialog } from "./CreateExperimentDialog";
import { ExperimentGrid } from "./ExperimentGrid";
import { ExperimentTable } from "./ExperimentTable";
import {
  ExperimentListError,
  ExperimentListLoading,
  ExperimentListEmpty,
} from "./ExperimentListStates";
import { useExperimentFilters } from "@/hooks/useExperimentFilters";
import type { Experiment, ViewMode } from "@/types/experiments";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ExperimentList() {
  const {
    data: experiments = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Experiment[]>("/api/experiments", fetcher);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const {
    searchQuery,
    setSearchQuery,
    sortConfig,
    toggleSort,
    sortedExperiments,
  } = useExperimentFilters(experiments);

  if (isLoading) {
    return <ExperimentListLoading />;
  }

  if (error) {
    return <ExperimentListError error={error} onRetry={() => mutate()} />;
  }

  if (!experiments || experiments.length === 0) {
    return <ExperimentListEmpty onExperimentCreated={mutate} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">
              Experiments
            </h1>
            <p className="text-sm text-white/60">
              Create and manage your LLM evaluation experiments
            </p>
          </div>
          <CreateExperimentDialog onExperimentCreated={mutate} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-white/40 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`border-slate-700 ${viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("table")}
              className={`border-slate-700 ${viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              <List className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-700"
                >
                  <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-slate-900 border-slate-800"
              >
                <DropdownMenuLabel className="text-white/60">
                  Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  className={`${sortConfig.field === "name" ? "bg-slate-800" : ""} text-white/80 focus:bg-slate-800 focus:text-white`}
                  onClick={() => toggleSort("name")}
                >
                  Name{" "}
                  {sortConfig.field === "name" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`${sortConfig.field === "createdAt" ? "bg-slate-800" : ""} text-white/80 focus:bg-slate-800 focus:text-white`}
                  onClick={() => toggleSort("createdAt")}
                >
                  Created Date{" "}
                  {sortConfig.field === "createdAt" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`${sortConfig.field === "testCaseCount" ? "bg-slate-800" : ""} text-white/80 focus:bg-slate-800 focus:text-white`}
                  onClick={() => toggleSort("testCaseCount")}
                >
                  Test Cases{" "}
                  {sortConfig.field === "testCaseCount" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <ExperimentGrid experiments={sortedExperiments} />
      ) : (
        <ExperimentTable experiments={sortedExperiments} />
      )}
    </div>
  );
}
