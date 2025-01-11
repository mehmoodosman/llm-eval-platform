import { NextResponse } from "next/server";
import {
  createExperiment,
  getExperiment,
  getExperimentWithTestCases,
  listExperiments,
} from "@/db/operations";
import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: experiments");

const createExperimentSchema = z.object({
  name: z.string(),
  systemPrompt: z.string(),
  modelIds: z.array(z.string()),
  testCaseIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  logger.info("POST /api/experiments - Starting experiment creation");

  try {
    const json = await request.json();
    logger.debug("Validating request body", { body: json });

    const body = createExperimentSchema.parse(json);
    logger.info("Request validation successful", {
      name: body.name,
      modelCount: body.modelIds.length,
      testCaseCount: body.testCaseIds?.length ?? 0,
    });

    logger.debug("Creating experiment in database", { body });
    const experiment = await createExperiment(body);
    logger.info("Experiment created successfully", {
      experimentId: experiment.id,
    });

    return NextResponse.json(experiment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in experiment creation", {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Failed to create experiment", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const includeTestCases = searchParams.get("includeTestCases") === "true";

  logger.info("GET /api/experiments", {
    id: id ?? "none",
    includeTestCases,
  });

  try {
    // If id is provided, get a single experiment
    if (id) {
      logger.debug("Fetching single experiment", { id, includeTestCases });

      const experiment = includeTestCases
        ? await getExperimentWithTestCases(id)
        : await getExperiment(id);

      if (!experiment) {
        logger.warn("Experiment not found", { id });
        return NextResponse.json(
          { error: "Experiment not found" },
          { status: 404 }
        );
      }

      logger.info("Successfully fetched experiment", {
        experimentId: id,
        hasTestCases: includeTestCases,
        resultType: includeTestCases ? "withTestCases" : "basic",
      });
      return NextResponse.json(experiment);
    }

    // Otherwise, list all experiments
    logger.debug("Fetching all experiments");
    const experiments = await listExperiments();
    logger.info("Successfully fetched experiments", {
      count: Array.isArray(experiments) ? experiments.length : 0,
    });
    return NextResponse.json(experiments);
  } catch (error) {
    logger.error("Failed to fetch experiments", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      id: id ?? "none",
    });
    return NextResponse.json(
      { error: "Failed to fetch experiments" },
      { status: 500 }
    );
  }
}
