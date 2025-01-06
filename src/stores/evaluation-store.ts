import { create } from "zustand";
import { StateCreator } from "zustand";
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
  setSystemPrompt: (prompt: string) => void;
  setUserMessage: (message: string) => void;
  setExpectedOutput: (output: string) => void;
  toggleModel: (value: string) => void;
  toggleMetric: (value: EvaluationMetric) => void;
  setResponses: (responses: Response[]) => void;
  setIsLoading: (isLoading: boolean) => void;
}

type EvaluationStoreCreator = StateCreator<EvaluationStore>;

export const useEvaluationStore = create<EvaluationStore>(
  (set: Parameters<EvaluationStoreCreator>[0]) => ({
    systemPrompt: "You are a helpful assistant.",
    userMessage: "What is the french revolution in 3 sentences?",
    expectedOutput:
      "The French Revolution, which began in 1789, was a period of radical social and political change in France that marked the decline of absolute monarchy and the rise of democracy. Fueled by Enlightenment ideas, economic hardship, and social inequality, the revolution led to the overthrow of King Louis XVI, the establishment of the First French Republic, and significant changes in the rights of citizens. It also inspired revolutionary movements worldwide, though it was marked by periods of violence, including the Reign of Terror, and ultimately set the stage for the rise of Napoleon Bonaparte.",
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
    toggleModel: (value: string) =>
      set((state: EvaluationStore) => {
        const isSelected = state.selectedModels.includes(value);
        if (isSelected) {
          // Don't remove if it's the last selected model
          if (state.selectedModels.length === 1) return state;
          return {
            selectedModels: state.selectedModels.filter(
              (v: string) => v !== value
            ),
          };
        }
        return { selectedModels: [...state.selectedModels, value] };
      }),
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
  })
);
