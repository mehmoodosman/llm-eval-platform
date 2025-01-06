import { TimingInfo as BaseTimingInfo } from "llm-chain/dist/types";
import { StreamingMetrics } from "llm-chain/dist/utils/timing";

export type { StreamingMetrics };

export interface TimingInfo extends BaseTimingInfo {
  streaming?: StreamingMetrics;
  evaluation?: { [key in EvaluationMetric]?: number };
}

export enum EvaluationMetric {
  EXACT_MATCH = "EXACT_MATCH",
  COSINE_SIMILARITY = "COSINE_SIMILARITY",
  LLM_JUDGE = "LLM_JUDGE",
}

export interface EvaluationRequest {
  systemPrompt: string;
  userMessage: string;
  expectedOutput: string;
  selectedModels: string[];
  selectedMetrics: EvaluationMetric[];
}

export interface Response {
  model: string;
  response: string;
  error?: string;
  metrics?: TimingInfo;
}

export interface ResponseListProps {
  responses: Response[];
  isStreaming?: boolean;
}

export interface StreamUpdate {
  model: string;
  response: string;
  delta?: string;
  error?: string;
  metrics?: TimingInfo;
}

export class EvaluationError extends Error {
  constructor(
    message: string,
    public readonly model?: string
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}
