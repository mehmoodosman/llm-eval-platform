import { EvaluationMetric } from "@/types/evaluation";
import OpenAI from "openai";
import { Logger } from "@/utils/logger";
import { LLMClient } from "llm-chain";
import { env } from "@/config/env";

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
  const systemPrompt = `You are an expert evaluator specialized in comparing and rating model responses against expected outputs. Your evaluation must be precise, consistent, and based on clear criteria.

Evaluation Criteria:
1. Semantic Similarity (40%)
   - How well the response captures the core meaning
   - Preservation of key concepts and relationships
   - Contextual understanding

2. Factual Accuracy (30%)
   - Correctness of specific facts and details
   - Absence of contradictions or errors
   - Precision in technical details if present

3. Completeness (20%)
   - Coverage of all essential points
   - Appropriate level of detail
   - No missing critical information

4. Clarity & Structure (10%)
   - Clear and logical organization
   - Professional and appropriate tone
   - Effective communication

Scoring Guide:
90-100: Exceptional match with minimal to no differences
80-89: Strong match with minor variations in expression
70-79: Good match with some non-critical differences
60-69: Acceptable match with notable differences
50-59: Partial match with significant gaps
0-49: Poor match or major discrepancies

Return only a JSON object with a "score" field containing your rating from 0-100.`;

  const userPrompt = `Please evaluate the following response against the expected output:

<ExpectedOutput>
${expectedOutput}
</ExpectedOutput>

<ActualResponse>
${response}
</ActualResponse>

Analyze the response according to the evaluation criteria and provide a score in JSON format.

IMPORTANT: DO NOT include backticks with 'json' in your response, just return the JSON object.

Example 1: 
{"score": 85}

Example 2: 
{"score": 40}
`;

  logger.info("LLM Judge prompts", { systemPrompt, userPrompt });

  const geminiClient = LLMClient.createGemini(env.GOOGLE_API_KEY);

  const result = await geminiClient.chatCompletion({
    model: "gemini-1.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  logger.info("LLM Judge result", { result });
  const score = JSON.parse(result.message.content || "0");
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
