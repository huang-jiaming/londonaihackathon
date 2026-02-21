import { NextRequest, NextResponse } from "next/server";
import { step2GenerateActionItems } from "@/lib/steps";
import type { RepoAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { analysis: RepoAnalysis };
    if (!body.analysis) {
      throw new Error("Missing analysis payload");
    }

    const actions = await step2GenerateActionItems(body.analysis);
    return NextResponse.json(actions);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Step 2 action generation failed unexpectedly"
      },
      { status: 400 }
    );
  }
}
