import { EvaluationMetric } from "@/types/evaluation";
import OpenAI from "openai";
import { Logger } from "@/utils/logger";
import { LLMClient } from "llm-chain";
import { env } from "@/config/env";

const logger = new Logger("EvaluationMetrics");

const openai = new OpenAI();

// Exact string match evaluation
export function exactMatch(response: string, expectedOutput: string): number {
  logger.info("Starting exact match evaluation", {
    responseLength: response.length,
    expectedLength: expectedOutput.length,
  });

  const result = response.trim() === expectedOutput.trim() ? 1 : 0;
  logger.info("Exact match result", { result });
  return result;
}

async function getOpenAIEmbeddings(response1: string, response2: string) {
  logger.info("Getting OpenAI embeddings", {
    response1Length: response1.length,
    response2Length: response2.length,
  });

  const responses = [response1, response2];

  try {
    const startTime = Date.now();
    const embeddings = await Promise.all(
      responses.map(response =>
        openai.embeddings.create({
          model: "text-embedding-3-small",
          input: [response],
        })
      )
    );
    const duration = Date.now() - startTime;

    logger.info("OpenAI embeddings retrieved successfully", {
      duration,
      embedding1Length: embeddings[0].data[0].embedding.length,
      embedding2Length: embeddings[1].data[0].embedding.length,
    });

    return embeddings;
  } catch (error) {
    logger.error("Failed to get OpenAI embeddings", { error });
    throw error;
  }
}

// Cosine similarity using dot product of normalized vectors
async function cosineSimilarity(
  modelResponse: string,
  expectedOutput: string
): Promise<number> {
  logger.info("Starting cosine similarity calculation");

  try {
    const embeddings = await getOpenAIEmbeddings(modelResponse, expectedOutput);
    const embedding1 = embeddings[0].data[0].embedding;
    const embedding2 = embeddings[1].data[0].embedding;

    if (embedding1.length !== embedding2.length) {
      logger.warn("Embedding lengths do not match", {
        embedding1Length: embedding1.length,
        embedding2Length: embedding2.length,
      });
      return 0;
    }

    const dotProduct = embedding1.reduce(
      (acc, val, i) => acc + val * embedding2[i],
      0
    );
    const mag1 = Math.sqrt(embedding1.reduce((acc, val) => acc + val * val, 0));
    const mag2 = Math.sqrt(embedding2.reduce((acc, val) => acc + val * val, 0));

    const similarity = dotProduct / (mag1 * mag2);

    logger.info("Cosine similarity calculation completed", {
      dotProduct,
      magnitude1: mag1,
      magnitude2: mag2,
      similarity,
    });

    return similarity;
  } catch (error) {
    logger.error("Error calculating cosine similarity", { error });
    throw error;
  }
}

// Cosine similarity evaluation
export async function cosineSimilarityMatch(
  modelResponse: string,
  expectedOutput: string
): Promise<number> {
  logger.info("Starting cosine similarity match");
  const result = await cosineSimilarity(modelResponse, expectedOutput);
  logger.info("Cosine similarity match completed", { result });
  return result;
}

// LLM judge evaluation
export async function llmJudge(
  response: string,
  expectedOutput: string
): Promise<number> {
  logger.info("Starting LLM judge evaluation", {
    responseLength: response.length,
    expectedOutputLength: expectedOutput.length,
  });

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

  logger.debug("LLM Judge prompts prepared", {
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
  });

  try {
    const startTime = Date.now();
    const geminiClient = LLMClient.createGemini(env.GOOGLE_API_KEY);

    const result = await geminiClient.chatCompletion({
      model: "gemini-1.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });
    const duration = Date.now() - startTime;

    logger.info("Gemini API call completed", {
      duration,
      responseLength: result.message.content?.length,
    });

    const score = JSON.parse(result.message.content || "0");
    logger.info("LLM Judge evaluation completed", { score: score.score });
    return score.score;
  } catch (error) {
    logger.error("Error in LLM judge evaluation", { error });
    throw error;
  }
}

// Main evaluation function that runs all selected metrics
export async function evaluateResponse(
  response: string,
  expectedOutput: string,
  metrics: EvaluationMetric[]
): Promise<{ [key in EvaluationMetric]?: number }> {
  logger.info("Starting response evaluation", {
    responseLength: response.length,
    expectedOutputLength: expectedOutput.length,
    metrics,
  });

  const results: { [key in EvaluationMetric]?: number } = {};
  const startTime = Date.now();

  try {
    for (const metric of metrics) {
      logger.info(`Evaluating metric: ${metric}`);
      const metricStartTime = Date.now();

      switch (metric) {
        case EvaluationMetric.EXACT_MATCH:
          results[metric] = exactMatch(response, expectedOutput);
          break;
        case EvaluationMetric.COSINE_SIMILARITY:
          results[metric] = await cosineSimilarityMatch(
            response,
            expectedOutput
          );
          break;
        case EvaluationMetric.LLM_JUDGE:
          results[metric] = await llmJudge(response, expectedOutput);
          break;
      }

      logger.info(`Metric ${metric} evaluation completed`, {
        duration: Date.now() - metricStartTime,
        result: results[metric],
      });
    }

    const totalDuration = Date.now() - startTime;
    logger.info("Response evaluation completed", { results, totalDuration });
    return results;
  } catch (error) {
    logger.error("Error during response evaluation", { error, metrics });
    throw error;
  }
}
