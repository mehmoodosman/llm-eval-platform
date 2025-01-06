import { NextResponse } from "next/server";
import {
  createExperiment,
  getExperiment,
  getExperimentWithTestCases,
} from "@/db/operations";
import { z } from "zod";

const createExperimentSchema = z.object({
  name: z.string(),
  systemPrompt: z.string(),
  model: z.string(),
  testCaseIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createExperimentSchema.parse(json);

    const experiment = await createExperiment(body);
    return NextResponse.json(experiment);
  } catch (error) {
    console.error("Error creating experiment:", error);
    return NextResponse.json(
      { error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const includeTestCases = searchParams.get("includeTestCases") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "Experiment ID is required" },
        { status: 400 }
      );
    }

    const experiment = includeTestCases
      ? await getExperimentWithTestCases(id)
      : await getExperiment(id);

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(experiment);
  } catch (error) {
    console.error("Error fetching experiment:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiment" },
      { status: 500 }
    );
  }
}
