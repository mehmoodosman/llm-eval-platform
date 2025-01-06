import { NextResponse } from "next/server";
import { createLLMChain } from "@/lib/llm-config";

interface EvaluationRequest {
  systemPrompt: string;
  userMessage: string;
  expectedOutput: string;
  selectedModels: string[];
}

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluationRequest;
    const { systemPrompt, userMessage, selectedModels } = body;

    // Initialize responses array
    const responses: ModelResponse[] = [];

    // Process each model in parallel
    const modelPromises = selectedModels.map(async modelId => {
      try {
        const client = createLLMChain(modelId);
        const completion = await client.chatCompletion({
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        responses.push({
          model: modelId,
          response: completion.message.content,
        });
      } catch (error) {
        responses.push({
          model: modelId,
          response: "",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    });

    // Wait for all model responses
    await Promise.all(modelPromises);

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to process evaluation request" },
      { status: 500 }
    );
  }
}
