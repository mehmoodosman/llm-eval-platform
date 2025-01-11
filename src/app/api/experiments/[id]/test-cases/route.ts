import { NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, testCases, experimentTestCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTestCasesForExperiment } from "@/db/operations";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: experiments/[id]/test-cases");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info(`Fetching test cases for experiment ${id}`);

    const testCasesList = await getTestCasesForExperiment(id);
    logger.info(
      `Successfully retrieved ${testCasesList.length} test cases for experiment ${id}`
    );

    return NextResponse.json(testCasesList);
  } catch (error) {
    logger.error(`Failed to fetch test cases for experiment: ${error}`);
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
    logger.info(`Linking test case ${testCaseId} to experiment ${id}`);

    if (!testCaseId) {
      logger.warn(`Missing testCaseId in request for experiment ${id}`);
      return NextResponse.json(
        { error: "testCaseId is required" },
        { status: 400 }
      );
    }

    logger.info(`Verifying experiment ${id} exists`);
    const experiment = await db
      .select()
      .from(experiments)
      .where(eq(experiments.id, id))
      .then(rows => rows[0]);

    if (!experiment) {
      logger.warn(`Experiment ${id} not found`);
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    logger.info(`Verifying test case ${testCaseId} exists`);
    const testCase = await db
      .select()
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .then(rows => rows[0]);

    if (!testCase) {
      logger.warn(`Test case ${testCaseId} not found`);
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    logger.info(
      `Linking test case ${testCaseId} to experiment ${id} in database`
    );
    await db.insert(experimentTestCases).values({
      experimentId: id,
      testCaseId: testCase.id,
    });

    logger.info(
      `Successfully linked test case ${testCaseId} to experiment ${id}`
    );
    return NextResponse.json(testCase);
  } catch (error) {
    logger.error(`Failed to link test case to experiment: ${error}`);
    return NextResponse.json(
      { error: "Failed to link test case" },
      { status: 500 }
    );
  }
}
