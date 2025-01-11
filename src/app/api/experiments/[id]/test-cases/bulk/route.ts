import { NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, experimentTestCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { EvaluationMetric } from "@/types/evaluation";
import { createTestCase } from "@/db/operations";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: bulk-test-cases");

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
    logger.info(
      `Received bulk test cases creation request for experiment ${id}`
    );

    // Verify experiment exists
    logger.debug(`Verifying experiment existence for ID: ${id}`);
    const experiment = await db
      .select()
      .from(experiments)
      .where(eq(experiments.id, id))
      .then(rows => rows[0]);

    if (!experiment) {
      logger.warn(`Experiment not found with ID: ${id}`);
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }
    logger.debug(`Experiment verified successfully: ${id}`);

    const json = await request.json();
    logger.debug("Validating request body schema");
    const { testCases: testCasesList } = bulkTestCaseSchema.parse(json);
    logger.info(`Received ${testCasesList.length} test cases to create`);

    // Create test cases and link them to the experiment
    logger.debug("Starting bulk test case creation");
    const createdTestCases = await Promise.all(
      testCasesList.map(async (testCase, index) => {
        logger.debug(`Creating test case ${index + 1}/${testCasesList.length}`);
        const created = await createTestCase({
          ...testCase,
          metrics: testCase.metrics || [EvaluationMetric.EXACT_MATCH],
        });

        // Link test case to experiment
        logger.debug(`Linking test case ${created.id} to experiment ${id}`);
        await db.insert(experimentTestCases).values({
          experimentId: id,
          testCaseId: created.id,
        });

        return created;
      })
    );

    logger.info(
      `Successfully created ${createdTestCases.length} test cases for experiment ${id}`
    );
    return NextResponse.json({
      count: createdTestCases.length,
      testCases: createdTestCases,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Schema validation failed", { error: error.errors });
      return NextResponse.json(
        { error: "Invalid test case format", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to create bulk test cases", { error });
    return NextResponse.json(
      { error: "Failed to create test cases" },
      { status: 500 }
    );
  }
}
