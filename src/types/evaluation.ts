import { TimingInfo } from "llm-chain/dist/types";
import { StreamingMetrics } from "llm-chain/dist/utils/timing";

export type { TimingInfo, StreamingMetrics };

export interface EvaluationRequest {
  systemPrompt: string;
  userMessage: string;
  expectedOutput: string;
  selectedModels: string[];
}

export interface Response {
  model: string;
  response: string;
  error?: string;
  metrics?: TimingInfo & {
    streaming?: StreamingMetrics;
  };
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
  metrics?: TimingInfo & {
    streaming?: StreamingMetrics;
  };
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
