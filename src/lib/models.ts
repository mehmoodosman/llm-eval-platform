interface LLMModel {
  value: string;
  label: string;
}

interface ModelCategory {
  category: string;
  models: LLMModel[];
}

export const LLM_MODELS: ModelCategory[] = [
  {
    category: "OpenAI",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o-mini" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
  },
  {
    category: "Anthropic",
    models: [
      { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus", label: "Claude 3 Opus" },
    ],
  },
  {
    category: "Google",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
  },
  {
    category: "Meta",
    models: [
      { value: "llama-3.1-8b", label: "LLaMA 3.1 8B" },
      { value: "llama-3.1-70b", label: "LLaMA 3.1 70B" },
    ],
  },
];

// Helper function to get all models flattened
export const ALL_MODELS = LLM_MODELS.flatMap(category => category.models);
