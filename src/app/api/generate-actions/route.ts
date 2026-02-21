import { NextRequest, NextResponse } from "next/server";
import { handleOptions, rejectDisallowedOrigin, withCors } from "@/lib/cors";
import { step2GenerateActionItems } from "@/lib/steps";
import type { RepoAnalysis } from "@/lib/types";

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as { analysis: RepoAnalysis };
    if (!body.analysis) {
      throw new Error("Missing analysis payload");
    }

    const actions = await step2GenerateActionItems(body.analysis);
    return withCors(request, NextResponse.json(actions));
  } catch (error) {
    return withCors(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Step 2 action generation failed unexpectedly"
        },
        { status: 400 }
      )
    );
  }
}
