import { db } from ".";
import { eq, and } from "drizzle-orm";
import {
  experiments,
  testCases,
  experimentTestCases,
  experimentResults,
} from "./schema";
import { EvaluationMetric } from "@/types/evaluation";

export type CreateExperimentInput = {
  name: string;
  systemPrompt: string;
  model: string;
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
  const experiment = await db.insert(experiments).values(input).returning();

  if (input.testCaseIds?.length) {
    await db.insert(experimentTestCases).values(
      input.testCaseIds.map(testCaseId => ({
        experimentId: experiment[0].id,
        testCaseId,
      }))
    );
  }

  return experiment[0];
}

export async function getExperiment(id: string) {
  const result = await db
    .select()
    .from(experiments)
    .where(eq(experiments.id, id));
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
      testCase: testCases,
    })
    .from(experimentTestCases)
    .innerJoin(testCases, eq(experimentTestCases.testCaseId, testCases.id))
    .where(eq(experimentTestCases.experimentId, experimentId));

  return result.map(r => r.testCase);
}

// Experiment Results Operations
export async function createExperimentResult(
  input: CreateExperimentResultInput
) {
  console.log(
    "Creating experiment result with input:",
    JSON.stringify(input, null, 2)
  );

  // Create a clean object with ONLY the values we want to insert, matching schema exactly
  const dbValues = {
    experimentId: input.experimentId,
    testCaseId: input.testCaseId,
    response: input.response,
    metrics: input.metrics,
    error: input.error,
    exactMatchScore: input.exactMatchScore,
    llmMatchScore: input.llmMatchScore,
    cosineSimilarityScore: input.cosineSimilarityScore,
  } satisfies typeof experimentResults.$inferInsert;

  // Validate required fields
  if (!dbValues.experimentId || !dbValues.testCaseId) {
    console.error("Missing required fields:", {
      experimentId: dbValues.experimentId,
      testCaseId: dbValues.testCaseId,
    });
    throw new Error("experimentId and testCaseId are required");
  }

  console.log("Inserting values:", JSON.stringify(dbValues, null, 2));

  // Insert ONLY our clean dbValues object
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
