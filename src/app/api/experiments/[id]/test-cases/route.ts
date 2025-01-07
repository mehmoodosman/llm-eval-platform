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
    const { testCaseId } = await request.json();

    if (!testCaseId) {
      return NextResponse.json(
        { error: "testCaseId is required" },
        { status: 400 }
      );
    }

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

    // Verify test case exists
    const testCase = await db
      .select()
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .then(rows => rows[0]);

    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    // Link test case to experiment
    await db.insert(experimentTestCases).values({
      experimentId: id,
      testCaseId: testCase.id,
    });

    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error linking test case:", error);
    return NextResponse.json(
      { error: "Failed to link test case" },
      { status: 500 }
    );
  }
}
