import { NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, testCases, experimentTestCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EvaluationMetric } from "@/types/evaluation";
import { getTestCasesForExperiment } from "@/db/operations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const testCasesList = await getTestCasesForExperiment(id);
    return NextResponse.json(testCasesList);
  } catch (error) {
    console.error("Error fetching test cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch test cases" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userMessage, expectedOutput } = await request.json();

    const experiment = await db
      .select()
      .from(experiments)
      .where(eq(experiments.id, id))
      .then(rows => rows[0]);

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Create test case
    const [testCase] = await db
      .insert(testCases)
      .values({
        userMessage,
        expectedOutput,
        metrics: [
          EvaluationMetric.EXACT_MATCH,
          EvaluationMetric.COSINE_SIMILARITY,
          EvaluationMetric.LLM_JUDGE,
        ],
      })
      .returning();

    // Link test case to experiment
    await db.insert(experimentTestCases).values({
      experimentId: id,
      testCaseId: testCase.id,
    });

    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error saving test case:", error);
    return NextResponse.json(
      { error: "Failed to save test case" },
      { status: 500 }
    );
  }
}
