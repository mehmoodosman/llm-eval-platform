"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { CreateExperimentDialog } from "./CreateExperimentDialog";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Grid,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";

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

type ViewMode = "grid" | "table";
type SortField = "name" | "createdAt" | "testCaseCount";
type SortOrder = "asc" | "desc";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ExperimentList() {
  const {
    data: experiments = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Experiment[]>("/api/experiments", fetcher);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const router = useRouter();

  const filteredExperiments = experiments.filter(
    experiment =>
      experiment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experiment.systemPrompt
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      experiment.models.some(
        model =>
          model.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const sortedExperiments = [...filteredExperiments].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortField === "testCaseCount") {
      return sortOrder === "asc"
        ? a.testCaseCount - b.testCaseCount
        : b.testCaseCount - a.testCaseCount;
    }
    // Default sort by createdAt
    return sortOrder === "asc"
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

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
          <p className="text-sm text-red-400">
            {error.message || "An error occurred"}
          </p>
        </div>
        <Button
          onClick={() => mutate()}
          variant="outline"
          className="border-white/10 text-white/80 hover:bg-slate-800/50 hover:border-white/20"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!experiments || experiments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-2xl border border-white/5 text-center mb-6 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2">
            No experiments yet
          </h3>
          <p className="text-white/60 mb-6">
            Create your first experiment to start evaluating your LLM models
          </p>
          <CreateExperimentDialog onExperimentCreated={mutate} />
        </div>
      </div>
    );
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
                  className={`${sortField === "name" ? "bg-slate-800" : ""} text-white/80 focus:bg-slate-800 focus:text-white`}
                  onClick={() => toggleSort("name")}
                >
                  Name{" "}
                  {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`${sortField === "createdAt" ? "bg-slate-800" : ""} text-white/80 focus:bg-slate-800 focus:text-white`}
                  onClick={() => toggleSort("createdAt")}
                >
                  Created Date{" "}
                  {sortField === "createdAt" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`${sortField === "testCaseCount" ? "bg-slate-800" : ""} text-white/80 focus:bg-slate-800 focus:text-white`}
                  onClick={() => toggleSort("testCaseCount")}
                >
                  Test Cases{" "}
                  {sortField === "testCaseCount" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedExperiments.map(experiment => (
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
                    <DropdownMenuTrigger
                      asChild
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-slate-900 border-slate-800"
                      onClick={e => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="text-white/80 focus:bg-slate-800 focus:text-white"
                        onClick={() =>
                          router.push(`/experiments/${experiment.id}`)
                        }
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400 focus:bg-red-950 focus:text-red-400"
                        onClick={() => {
                          /* TODO: Add delete functionality */
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
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
                    {experiment.testCaseCount === 1
                      ? "test case"
                      : "test cases"}
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
      ) : (
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Models</TableHead>
                <TableHead className="text-white/60 text-right">
                  Test Cases
                </TableHead>
                <TableHead className="text-white/60">Created</TableHead>
                <TableHead className="text-white/60 w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExperiments.map(experiment => (
                <TableRow
                  key={experiment.id}
                  className="border-white/5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/experiments/${experiment.id}`)}
                >
                  <TableCell className="font-medium text-white">
                    {experiment.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {experiment.models.map(model => (
                        <span
                          key={model.id}
                          className="px-2 py-1 rounded-full bg-slate-800 text-white/70 font-mono text-xs"
                          title={`${model.category} - ${model.label}`}
                        >
                          {model.value}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-white/60">
                    {experiment.testCaseCount}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {formatDistanceToNow(new Date(experiment.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={e => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/40 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-slate-900 border-slate-800"
                      >
                        <DropdownMenuItem
                          className="text-white/80 focus:bg-slate-800 focus:text-white"
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/experiments/${experiment.id}`);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-950 focus:text-red-400"
                          onClick={e => {
                            e.stopPropagation();
                            /* TODO: Add delete functionality */
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
