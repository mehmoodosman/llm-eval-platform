import { create } from "zustand";
import { EvaluationMetric } from "@/types/evaluation";

interface Response {
  model: string;
  response: string;
  error?: string;
  metrics?: {
    startTime: number;
    endTime: number;
    duration: number;
    streaming?: {
      timeToFirstToken: number;
      tokensPerSecond: number;
      totalResponseTime: number;
      totalTokens: number;
    };
  };
}

interface EvaluationStore {
  systemPrompt: string;
  userMessage: string;
  expectedOutput: string;
  selectedModels: string[];
  selectedMetrics: EvaluationMetric[];
  responses: Response[];
  isLoading: boolean;
  experimentId?: string;
  setSystemPrompt: (prompt: string) => void;
  setUserMessage: (message: string) => void;
  setExpectedOutput: (output: string) => void;
  setSelectedModels: (models: string[]) => void;
  toggleMetric: (value: EvaluationMetric) => void;
  setResponses: (responses: Response[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setExperimentId: (id: string) => void;
  saveTestCase: () => Promise<void>;
}

export const useEvaluationStore = create<EvaluationStore>((set, get) => ({
  systemPrompt: "You are a helpful assistant.",
  userMessage: "",
  expectedOutput: "",
  selectedModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
  selectedMetrics: [
    EvaluationMetric.EXACT_MATCH,
    EvaluationMetric.COSINE_SIMILARITY,
    EvaluationMetric.LLM_JUDGE,
  ],
  responses: [],
  isLoading: false,
  setSystemPrompt: (prompt: string) => set({ systemPrompt: prompt }),
  setUserMessage: (message: string) => set({ userMessage: message }),
  setExpectedOutput: (output: string) => set({ expectedOutput: output }),
  setSelectedModels: (models: string[]) => set({ selectedModels: models }),
  toggleMetric: (value: EvaluationMetric) =>
    set((state: EvaluationStore) => {
      const isSelected = state.selectedMetrics.includes(value);
      if (isSelected) {
        // Don't remove if it's the last selected metric
        if (state.selectedMetrics.length === 1) return state;
        return {
          selectedMetrics: state.selectedMetrics.filter(v => v !== value),
        };
      }
      return { selectedMetrics: [...state.selectedMetrics, value] };
    }),
  setResponses: (responses: Response[]) => set({ responses }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setExperimentId: (id: string) => set({ experimentId: id }),
  saveTestCase: async () => {
    const state = get();
    if (!state.experimentId) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/experiments/${state.experimentId}/test-cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userMessage: state.userMessage,
        expectedOutput: state.expectedOutput,
        responses: state.responses,
      }),
    });
  },
}));
