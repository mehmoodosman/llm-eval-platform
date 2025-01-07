export interface Model {
  id: string;
  value: string;
  label: string;
  category: string;
}

export interface Experiment {
  id: string;
  name: string;
  models: Model[];
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
  testCaseCount: number;
}

export type ViewMode = "grid" | "table";
export type SortField = "name" | "createdAt" | "testCaseCount";
export type SortOrder = "asc" | "desc";

export interface ExperimentSortConfig {
  field: SortField;
  order: SortOrder;
}

export interface ExperimentListProps {
  experiments: Experiment[];
  isLoading: boolean;
  error?: Error;
  onExperimentCreated: () => void;
  onExperimentDelete?: (id: string) => void;
}
