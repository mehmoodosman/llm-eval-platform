import { EvaluationMetric } from "@/types/evaluation";
import OpenAI from "openai";
import { Logger } from "@/utils/logger";

const logger = new Logger("EvaluationMetrics");

const openai = new OpenAI();

// Exact string match evaluation
export function exactMatch(response: string, expectedOutput: string): number {
  return response.trim() === expectedOutput.trim() ? 1 : 0;
}

async function getOpenAIEmbeddings(response1: string, response2: string) {
  const responses = [response1, response2];

  const embeddings = await Promise.all(
    responses.map(response =>
      openai.embeddings.create({
        model: "text-embedding-3-small",
        input: [response],
      })
    )
  );

  return embeddings;
}

// Cosine similarity using dot product of normalized vectors
async function cosineSimilarity(
  modelResponse: string,
  expectedOutput: string
): Promise<number> {
  const embeddings = await getOpenAIEmbeddings(modelResponse, expectedOutput);
  const embedding1 = embeddings[0].data[0].embedding;
  const embedding2 = embeddings[1].data[0].embedding;

  if (embedding1.length !== embedding2.length) return 0;

  const dotProduct = embedding1.reduce(
    (acc, val, i) => acc + val * embedding2[i],
    0
  );
  const mag1 = Math.sqrt(embedding1.reduce((acc, val) => acc + val * val, 0));
  const mag2 = Math.sqrt(embedding2.reduce((acc, val) => acc + val * val, 0));

  return dotProduct / (mag1 * mag2);
}

// Cosine similarity evaluation
export async function cosineSimilarityMatch(
  modelResponse: string,
  expectedOutput: string
): Promise<number> {
  return cosineSimilarity(modelResponse, expectedOutput);
}

// LLM judge evaluation
export async function llmJudge(
  response: string,
  expectedOutput: string
): Promise<number> {
  const prompt = `You are an expert evaluator tasked with comparing a model's response against an expected output. Evaluate the semantic similarity, factual accuracy, and overall quality of the response.

Consider the following aspects in your evaluation:
- Semantic similarity: How well does the response match the meaning and intent of the expected output?
- Factual accuracy: Are all facts and details consistent with the expected output?
- Completeness: Does the response cover all key points from the expected output?
- Clarity and coherence: Is the response well-structured and clearly expressed?

Expected Output:
${expectedOutput}

Actual Response:
${response}

Rate the response on a scale of 0 to 100:
- 90-100: Near perfect match in meaning and content
- 70-89: Good match with minor differences
- 50-69: Partial match with some key differences
- 0-49: Poor match or significant differences

Return only a JSON object with a "score" field containing your rating from 0-100.
Example: {"score": 85}`;

  logger.info("LLM Judge prompt", { prompt });

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert evaluator." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  logger.info("LLM Judge result", { result });
  const score = JSON.parse(result.choices[0].message.content || "0");
  return score.score;
}

// Main evaluation function that runs all selected metrics
export async function evaluateResponse(
  response: string,
  expectedOutput: string,
  metrics: EvaluationMetric[]
): Promise<{ [key in EvaluationMetric]?: number }> {
  const results: { [key in EvaluationMetric]?: number } = {};

  for (const metric of metrics) {
    switch (metric) {
      case EvaluationMetric.EXACT_MATCH:
        results[metric] = exactMatch(response, expectedOutput);
        break;
      case EvaluationMetric.COSINE_SIMILARITY:
        results[metric] = await cosineSimilarityMatch(response, expectedOutput);
        break;
      case EvaluationMetric.LLM_JUDGE:
        results[metric] = await llmJudge(response, expectedOutput);
        break;
    }
  }

  return results;
}
