import { NextResponse } from "next/server";
import { listModels } from "@/db/operations";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: models");

export async function GET() {
  const startTime = Date.now();
  logger.info("Starting models fetch request", { method: "GET" });

  try {
    const models = await listModels();
    const duration = Date.now() - startTime;

    logger.info("Successfully fetched models", {
      modelCount: models.length,
      durationMs: duration,
    });

    return NextResponse.json(models);
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Failed to fetch models", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: duration,
    });

    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
