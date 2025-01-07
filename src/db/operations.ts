import { db } from ".";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  experiments,
  testCases,
  experimentTestCases,
  experimentResults,
  models,
  experimentModels,
} from "./schema";
import { EvaluationMetric } from "@/types/evaluation";

export type CreateExperimentInput = {
  name: string;
  systemPrompt: string;
  modelIds: string[];
  testCaseIds?: string[];
};

export type CreateTestCaseInput = {
  userMessage: string;
  expectedOutput: string;
  metrics: EvaluationMetric[];
};

export type CreateExperimentResultInput = {
  experimentId: string;
  testCaseId: string;
  response: string;
  exactMatchScore?: string;
  llmMatchScore?: string;
  cosineSimilarityScore?: string;
  metrics?: Record<EvaluationMetric, number>;
  error?: string;
};

// Experiment Operations
export async function createExperiment(input: CreateExperimentInput) {
  const { modelIds, ...experimentData } = input;

  const experiment = await db
    .insert(experiments)
    .values(experimentData)
    .returning();
  const experimentId = experiment[0].id;

  // Create experiment-model relationships
  if (modelIds?.length) {
    await db.insert(experimentModels).values(
      modelIds.map(modelId => ({
        experimentId,
        modelId,
      }))
    );
  }

  // Create experiment-testcase relationships
  if (input.testCaseIds?.length) {
    await db.insert(experimentTestCases).values(
      input.testCaseIds.map(testCaseId => ({
        experimentId,
        testCaseId,
      }))
    );
  }

  return experiment[0];
}

export async function getExperiment(id: string) {
  const result = await db
    .select({
      experiment: experiments,
      models: sql<any>`
        COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', ${models.id},
              'value', ${models.value},
              'label', ${models.label},
              'category', ${models.category}
            )
          ) FILTER (WHERE ${models.id} IS NOT NULL),
          '[]'::JSONB
        )
      `,
    })
    .from(experiments)
    .leftJoin(
      experimentModels,
      eq(experiments.id, experimentModels.experimentId)
    )
    .leftJoin(models, eq(experimentModels.modelId, models.id))
    .where(eq(experiments.id, id))
    .groupBy(experiments.id);

  return result[0];
}

export async function getExperimentWithTestCases(id: string) {
  const result = await db
    .select({
      experiment: experiments,
      testCases: testCases,
    })
    .from(experiments)
    .leftJoin(
      experimentTestCases,
      eq(experiments.id, experimentTestCases.experimentId)
    )
    .leftJoin(testCases, eq(experimentTestCases.testCaseId, testCases.id))
    .where(eq(experiments.id, id));

  return result;
}

// Test Case Operations
export async function createTestCase(input: CreateTestCaseInput) {
  const testCase = await db.insert(testCases).values(input).returning();
  return testCase[0];
}

export async function getTestCase(id: string) {
  const result = await db.select().from(testCases).where(eq(testCases.id, id));
  return result[0];
}

export async function getTestCasesForExperiment(experimentId: string) {
  const result = await db
    .select({
      id: testCases.id,
      userMessage: testCases.userMessage,
      expectedOutput: testCases.expectedOutput,
      metrics: testCases.metrics,
      createdAt: testCases.createdAt,
      results: sql<any>`
        COALESCE(
          JSONB_AGG(
            CASE WHEN ${experimentResults.id} IS NOT NULL THEN
              JSONB_BUILD_OBJECT(
                'id', ${experimentResults.id},
                'response', ${experimentResults.response},
                'exactMatchScore', ${experimentResults.exactMatchScore},
                'llmMatchScore', ${experimentResults.llmMatchScore},
                'cosineSimilarityScore', ${experimentResults.cosineSimilarityScore},
                'metrics', ${experimentResults.metrics},
                'error', ${experimentResults.error}
              )
            END
          ) FILTER (WHERE ${experimentResults.id} IS NOT NULL),
          '[]'::JSONB
        )
      `,
    })
    .from(experimentTestCases)
    .innerJoin(testCases, eq(experimentTestCases.testCaseId, testCases.id))
    .leftJoin(
      experimentResults,
      and(
        eq(experimentResults.testCaseId, testCases.id),
        eq(experimentResults.experimentId, experimentId)
      )
    )
    .where(eq(experimentTestCases.experimentId, experimentId))
    .groupBy(testCases.id);

  return result;
}

// Experiment Results Operations
export async function createExperimentResult(
  input: CreateExperimentResultInput & { modelId: string }
) {
  console.log(
    "Creating experiment result with input:",
    JSON.stringify(input, null, 2)
  );

  // Create a clean object with ONLY the values we want to insert, matching schema exactly
  const dbValues = {
    experimentId: input.experimentId,
    modelId: input.modelId,
    testCaseId: input.testCaseId,
    response: input.response,
    metrics: input.metrics,
    error: input.error,
    exactMatchScore: input.exactMatchScore,
    llmMatchScore: input.llmMatchScore,
    cosineSimilarityScore: input.cosineSimilarityScore,
  } satisfies typeof experimentResults.$inferInsert;

  // Validate required fields
  if (!dbValues.experimentId || !dbValues.testCaseId || !dbValues.modelId) {
    console.error("Missing required fields:", {
      experimentId: dbValues.experimentId,
      testCaseId: dbValues.testCaseId,
      modelId: dbValues.modelId,
    });
    throw new Error("experimentId, testCaseId, and modelId are required");
  }

  console.log("Inserting values:", JSON.stringify(dbValues, null, 2));

  const result = await db
    .insert(experimentResults)
    .values(dbValues)
    .returning();
  console.log("Database insert result:", JSON.stringify(result, null, 2));
  return result[0];
}

export async function getExperimentResults(experimentId: string) {
  const results = await db
    .select()
    .from(experimentResults)
    .where(eq(experimentResults.experimentId, experimentId));

  return results;
}

export async function getTestCaseResults(
  experimentId: string,
  testCaseId: string
) {
  const results = await db
    .select()
    .from(experimentResults)
    .where(
      and(
        eq(experimentResults.experimentId, experimentId),
        eq(experimentResults.testCaseId, testCaseId)
      )
    );

  return results[0];
}

export async function listExperiments() {
  const result = await db
    .select({
      id: experiments.id,
      name: experiments.name,
      systemPrompt: experiments.systemPrompt,
      createdAt: experiments.createdAt,
      updatedAt: experiments.updatedAt,
      models: sql<any>`
        COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', ${models.id},
              'value', ${models.value},
              'label', ${models.label},
              'category', ${models.category}
            )
          ) FILTER (WHERE ${models.id} IS NOT NULL),
          '[]'::JSONB
        )
      `,
      testCaseCount: sql<number>`
        CAST((
          SELECT COUNT(*)
          FROM ${experimentTestCases}
          WHERE ${experimentTestCases.experimentId} = ${experiments.id}
        ) AS integer)
      `,
    })
    .from(experiments)
    .leftJoin(
      experimentModels,
      eq(experiments.id, experimentModels.experimentId)
    )
    .leftJoin(models, eq(experimentModels.modelId, models.id))
    .groupBy(experiments.id)
    .orderBy(desc(experiments.createdAt));

  return result;
}

// Model Operations
export async function listModels() {
  return db.select().from(models).orderBy(models.category, models.label);
}

export async function seedModels() {
  const modelData = [
    { value: "gpt-4o", label: "GPT-4o", category: "OpenAI" },
    { value: "gpt-4o-mini", label: "GPT-4o-mini", category: "OpenAI" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", category: "OpenAI" },
    {
      value: "gemini-2.0-flash-exp",
      label: "Gemini 2.0 Flash",
      category: "Google",
    },
    {
      value: "gemini-1.5-flash",
      label: "Gemini 1.5 Flash",
      category: "Google",
    },
    {
      value: "llama-3.1-8b-instant",
      label: "LLaMA 3.1 8B Instant",
      category: "Meta",
    },
    {
      value: "llama-3.3-70b-versatile",
      label: "LLaMA 3.3 70B Versatile",
      category: "Meta",
    },
  ];

  await db.insert(models).values(modelData).onConflictDoNothing();
}
