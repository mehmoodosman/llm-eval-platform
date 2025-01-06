import { LLMClient } from "llm-chain";
import { env } from "@/config/env";

export const createLLMChain = (modelId: string) => {
  if (modelId.startsWith("gpt-")) {
    return LLMClient.createOpenAI(env.OPENAI_API_KEY);
    //   } else if (modelId.startsWith("claude-")) {
    //     return LLMClient.createAnthropic(env.ANTHROPIC_API_KEY);
  } else if (modelId.startsWith("gemini-")) {
    return LLMClient.createGemini(env.GOOGLE_API_KEY);
  } else if (modelId.startsWith("llama-")) {
    return LLMClient.createGroq(env.GROQ_API_KEY);
  }
  throw new Error(`Unsupported model: ${modelId}`);
};
