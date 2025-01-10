import { NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, experimentTestCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { EvaluationMetric } from "@/types/evaluation";
import { createTestCase } from "@/db/operations";

const bulkTestCaseSchema = z.object({
  testCases: z.array(
    z.object({
      userMessage: z.string(),
      expectedOutput: z.string(),
      metrics: z.array(z.nativeEnum(EvaluationMetric)).optional(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify experiment exists
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

    const json = await request.json();
    const { testCases: testCasesList } = bulkTestCaseSchema.parse(json);

    // Create test cases and link them to the experiment
    const createdTestCases = await Promise.all(
      testCasesList.map(async testCase => {
        const created = await createTestCase({
          ...testCase,
          metrics: testCase.metrics || [EvaluationMetric.EXACT_MATCH],
        });

        // Link test case to experiment
        await db.insert(experimentTestCases).values({
          experimentId: id,
          testCaseId: created.id,
        });

        return created;
      })
    );

    return NextResponse.json({
      count: createdTestCases.length,
      testCases: createdTestCases,
    });
  } catch (error) {
    console.error("Error creating bulk test cases:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid test case format", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create test cases" },
      { status: 500 }
    );
  }
}
