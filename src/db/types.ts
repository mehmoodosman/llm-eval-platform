import { EvaluationMetric } from "@/types/evaluation";

// SQL result types
export type ModelAggregation = {
  id: string;
  value: string;
  label: string;
  category: string;
};

export type ExperimentResultAggregation = {
  id: string;
  response: string;
  exactMatchScore: string | null;
  llmMatchScore: string | null;
  cosineSimilarityScore: string | null;
  metrics: Record<EvaluationMetric, number> | null;
  error: string | null;
};

// Input types
export type CreateExperimentInput = {
  name: string;
  systemPrompt: string;
  modelIds: string[];
  testCaseIds?: string[];
};

export type CreateTestCaseInput = {
  userMessage: string;
  expectedOutput: string;
  metrics: EvaluationMetric[];
};

export type CreateExperimentResultInput = {
  experimentId: string;
  testCaseId: string;
  response: string;
  exactMatchScore?: string;
  llmMatchScore?: string;
  cosineSimilarityScore?: string;
  metrics?: Record<EvaluationMetric, number>;
  error?: string;
};
