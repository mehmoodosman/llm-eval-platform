import { NextResponse } from "next/server";
import {
  createTestCase,
  getTestCase,
  getTestCasesForExperiment,
} from "@/db/operations";
import { z } from "zod";
import { EvaluationMetric } from "@/types/evaluation";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: test-cases");

const createTestCaseSchema = z.object({
  userMessage: z.string(),
  expectedOutput: z.string(),
  metrics: z.array(z.nativeEnum(EvaluationMetric)),
});

export async function POST(request: Request) {
  logger.info("Received POST request to create test case");

  try {
    const json = await request.json();
    logger.debug("Validating request body", { body: json });

    const body = createTestCaseSchema.parse(json);
    logger.info("Creating test case with data", {
      messageLength: body.userMessage.length,
      expectedOutputLength: body.expectedOutput.length,
      metricsCount: body.metrics.length,
    });

    const testCase = await createTestCase(body);
    logger.info("Successfully created test case", { id: testCase.id });

    return NextResponse.json(testCase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error creating test case", {
        error: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Error creating test case", { error });
    return NextResponse.json(
      { error: "Failed to create test case" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const experimentId = searchParams.get("experimentId");

  logger.info("Received GET request for test case(s)", { id, experimentId });

  try {
    if (!id && !experimentId) {
      logger.warn("Request missing required parameters");
      return NextResponse.json(
        { error: "Either test case ID or experiment ID is required" },
        { status: 400 }
      );
    }

    if (experimentId) {
      logger.info("Fetching test cases for experiment", { experimentId });
      const testCases = await getTestCasesForExperiment(experimentId);
      logger.info("Successfully fetched test cases", {
        experimentId,
        count: testCases.length,
      });
      return NextResponse.json(testCases);
    }

    logger.info("Fetching single test case", { id });
    const testCase = await getTestCase(id!);

    if (!testCase) {
      logger.warn("Test case not found", { id });
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    logger.info("Successfully fetched test case", { id });
    return NextResponse.json(testCase);
  } catch (error) {
    logger.error("Error fetching test case", {
      error,
      id,
      experimentId,
    });
    return NextResponse.json(
      { error: "Failed to fetch test case" },
      { status: 500 }
    );
  }
}
