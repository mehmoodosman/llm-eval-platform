import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  experiments,
  models,
  experimentModels,
  experimentTestCases,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: experiments/[id]");

type ModelResult = {
  id: string;
  value: string;
  label: string;
  category: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string = "";
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    logger.info(`Fetching experiment with id: ${id}`);

    logger.debug("Executing database query to fetch experiment details");
    const result = await db
      .select({
        id: experiments.id,
        name: experiments.name,
        systemPrompt: experiments.systemPrompt,
        createdAt: experiments.createdAt,
        updatedAt: experiments.updatedAt,
        models: sql<ModelResult[]>`
          COALESCE(
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', ${models.id},
                'value', ${models.value},
                'label', ${models.label},
                'category', ${models.category}
              )
            ) FILTER (WHERE ${models.id} IS NOT NULL),
            '[]'::JSONB
          )
        `,
        testCaseCount: sql<number>`
          CAST((
            SELECT COUNT(*)
            FROM ${experimentTestCases}
            WHERE ${experimentTestCases.experimentId} = ${experiments.id}
          ) AS integer)
        `,
      })
      .from(experiments)
      .leftJoin(
        experimentModels,
        eq(experiments.id, experimentModels.experimentId)
      )
      .leftJoin(models, eq(experimentModels.modelId, models.id))
      .where(eq(experiments.id, id))
      .groupBy(experiments.id);
    logger.debug("Database query completed successfully");

    if (!result.length) {
      logger.warn(`No experiment found with id: ${id}`);
      return new NextResponse(null, { status: 404 });
    }

    logger.info(`Successfully retrieved experiment: ${id}`, {
      experimentName: result[0].name,
      modelCount: result[0].models.length,
      testCaseCount: result[0].testCaseCount,
    });
    return NextResponse.json(result[0]);
  } catch (error) {
    logger.error("Error fetching experiment", {
      error: error instanceof Error ? error.message : String(error),
      experimentId: id,
    });
    return new NextResponse(null, { status: 500 });
  }
}
