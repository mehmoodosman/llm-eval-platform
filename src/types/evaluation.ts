export interface StreamingMetrics {
  timeToFirstToken: number;
  tokensPerSecond: number;
  totalResponseTime: number;
  totalTokens: number;
}

export interface TimingInfo {
  startTime: number;
  endTime: number;
  duration: number;
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
