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
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
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

    if (!result.length) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching experiment:", error);
    return new NextResponse(null, { status: 500 });
  }
}
