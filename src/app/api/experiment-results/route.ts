import { NextResponse } from "next/server";
import {
  createExperimentResult,
  getExperimentResults,
  getTestCaseResults,
} from "@/db/operations";
import { z } from "zod";
import { EvaluationMetric } from "@/types/evaluation";

const createResultSchema = z.object({
  experimentId: z.string(),
  testCaseId: z.string(),
  modelId: z.string(),
  response: z.string(),
  exactMatchScore: z.string().optional(),
  llmMatchScore: z.string().optional(),
  cosineSimilarityScore: z.string().optional(),
  metrics: z.record(z.nativeEnum(EvaluationMetric), z.number()).nullish(),
  error: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log(
      "Received experiment result POST:",
      JSON.stringify(json, null, 2)
    );

    // Validate required fields before schema validation
    if (!json.experimentId || !json.testCaseId || !json.modelId) {
      console.error("Missing required fields:", {
        experimentId: json.experimentId,
        testCaseId: json.testCaseId,
        modelId: json.modelId,
      });
      return NextResponse.json(
        { error: "experimentId, testCaseId, and modelId are required" },
        { status: 400 }
      );
    }

    console.log("Validating with schema:", json);
    const body = createResultSchema.parse(json);
    console.log("Schema validation passed:", JSON.stringify(body, null, 2));

    const transformedData = {
      ...body,
      metrics: body.metrics
        ? (Object.fromEntries(
            Object.values(EvaluationMetric).map(metric => [
              metric,
              body.metrics?.[metric as EvaluationMetric] ?? 0,
            ])
          ) as Record<EvaluationMetric, number>)
        : undefined,
    };
    console.log(
      "Transformed data for DB:",
      JSON.stringify(transformedData, null, 2)
    );

    console.log("Calling createExperimentResult with:", transformedData);
    const result = await createExperimentResult(transformedData);
    console.log("Created experiment result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating experiment result:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create experiment result" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get("experimentId");
    const testCaseId = searchParams.get("testCaseId");

    console.log("Fetching experiment results:", { experimentId, testCaseId });

    if (!experimentId) {
      return NextResponse.json(
        { error: "Experiment ID is required" },
        { status: 400 }
      );
    }

    if (testCaseId) {
      const result = await getTestCaseResults(experimentId, testCaseId);
      console.log("Test case results:", result);
      if (!result) {
        return NextResponse.json(
          { error: "Result not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result);
    }

    const results = await getExperimentResults(experimentId);
    console.log("All experiment results:", results);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching experiment results:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiment results" },
      { status: 500 }
    );
  }
}
