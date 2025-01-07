import { useState, useMemo } from "react";
import type {
  Experiment,
  SortField,
  ExperimentSortConfig,
} from "@/types/experiments";

export function useExperimentFilters(experiments: Experiment[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<ExperimentSortConfig>({
    field: "createdAt",
    order: "desc",
  });

  const filteredExperiments = useMemo(() => {
    return experiments.filter(
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
  }, [experiments, searchQuery]);

  const sortedExperiments = useMemo(() => {
    return [...filteredExperiments].sort((a, b) => {
      const { field, order } = sortConfig;

      if (field === "name") {
        return order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (field === "testCaseCount") {
        return order === "asc"
          ? a.testCaseCount - b.testCaseCount
          : b.testCaseCount - a.testCaseCount;
      }
      // Default sort by createdAt
      return order === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredExperiments, sortConfig]);

  const toggleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      order:
        current.field === field && current.order === "asc" ? "desc" : "asc",
    }));
  };

  return {
    searchQuery,
    setSearchQuery,
    sortConfig,
    toggleSort,
    sortedExperiments,
  };
}
