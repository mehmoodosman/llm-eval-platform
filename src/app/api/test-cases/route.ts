import { NextResponse } from "next/server";
import {
  createTestCase,
  getTestCase,
  getTestCasesForExperiment,
} from "@/db/operations";
import { z } from "zod";
import { EvaluationMetric } from "@/types/evaluation";

const createTestCaseSchema = z.object({
  userMessage: z.string(),
  expectedOutput: z.string(),
  metrics: z.array(z.nativeEnum(EvaluationMetric)),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createTestCaseSchema.parse(json);

    const testCase = await createTestCase(body);
    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error creating test case:", error);
    return NextResponse.json(
      { error: "Failed to create test case" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const experimentId = searchParams.get("experimentId");

    if (!id && !experimentId) {
      return NextResponse.json(
        { error: "Either test case ID or experiment ID is required" },
        { status: 400 }
      );
    }

    if (experimentId) {
      const testCases = await getTestCasesForExperiment(experimentId);
      return NextResponse.json(testCases);
    }

    const testCase = await getTestCase(id!);
    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error fetching test case:", error);
    return NextResponse.json(
      { error: "Failed to fetch test case" },
      { status: 500 }
    );
  }
}
