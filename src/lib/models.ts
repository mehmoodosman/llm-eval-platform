interface LLMModel {
  id: string;
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
      {
        id: "b571e000-888c-4f1c-be50-8a77395237f3",
        value: "gpt-4o",
        label: "GPT-4o",
      },
      {
        id: "041df542-de82-4bc9-aec9-e0fe4b11b91d",
        value: "gpt-4o-mini",
        label: "GPT-4o-mini",
      },
      {
        id: "dbfb86ca-0ed2-4fb3-a10e-c6592d37430a",
        value: "gpt-3.5-turbo",
        label: "GPT-3.5 Turbo",
      },
    ],
  },
  {
    category: "Google",
    models: [
      {
        id: "d00a656d-d3c7-4fd5-8545-22d8bd26e577",
        value: "gemini-2.0-flash-exp",
        label: "Gemini 2.0 Flash",
      },
      {
        id: "a07e1a4a-5f42-41a0-9024-9dbf9a6b8619",
        value: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
      },
    ],
  },
  {
    category: "Meta",
    models: [
      {
        id: "d9de1159-02e7-4e58-b56a-14b4dacb086a",
        value: "llama-3.1-8b-instant",
        label: "LLaMA 3.1 8B Instant",
      },
      {
        id: "4102e620-f652-4e5b-a3c7-702f279b3182",
        value: "llama-3.3-70b-versatile",
        label: "LLaMA 3.3 70B Versatile",
      },
    ],
  },
];

// Helper function to get all models flattened
export const ALL_MODELS = LLM_MODELS.flatMap(category => category.models);
