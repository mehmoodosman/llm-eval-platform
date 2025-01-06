import { create } from "zustand";
import { StateCreator } from "zustand";

interface Response {
  model: string;
  response: string;
  error?: string;
}

interface EvaluationStore {
  systemPrompt: string;
  userMessage: string;
  expectedOutput: string;
  selectedModels: string[];
  responses: Response[];
  isLoading: boolean;
  setSystemPrompt: (prompt: string) => void;
  setUserMessage: (message: string) => void;
  setExpectedOutput: (output: string) => void;
  toggleModel: (value: string) => void;
  setResponses: (responses: Response[]) => void;
  setIsLoading: (isLoading: boolean) => void;
}

type EvaluationStoreCreator = StateCreator<EvaluationStore>;

export const useEvaluationStore = create<EvaluationStore>(
  (set: Parameters<EvaluationStoreCreator>[0]) => ({
    systemPrompt: "You are a helpful assistant.",
    userMessage: "What is the capital of France?",
    expectedOutput: "The capital of France is Paris.",
    selectedModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
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
    setResponses: (responses: Response[]) => set({ responses }),
    setIsLoading: (isLoading: boolean) => set({ isLoading }),
  })
);
