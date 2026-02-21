import { NextRequest, NextResponse } from "next/server";
import { handleOptions, rejectDisallowedOrigin, withCors } from "@/lib/cors";
import {
  step1IngestAndReview,
  step2GenerateActionItems,
  step3StructureWithDust,
  step4ExportWithCodeWords
} from "@/lib/steps";
import type { IngestInput, RepoContext } from "@/lib/types";

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as IngestInput;

    const step1 = await step1IngestAndReview(body);
    const step2 = await step2GenerateActionItems(step1);
    const step3 = await step3StructureWithDust(step2);
    const repoName = body.repoUrl?.trim()
      ? body.repoUrl.trim().replace(/\/+$/, "").split("/").pop()?.replace(/\.git$/i, "")
      : undefined;
    const repoContext: RepoContext = {
      repoName: repoName || undefined,
      repoUrl: body.repoUrl?.trim() || undefined
    };
    const step4 = await step4ExportWithCodeWords(step3, repoContext);

    return withCors(
      request,
      NextResponse.json({
        step1,
        step2,
        step3,
        step4
      })
    );
  } catch (error) {
    return withCors(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Pipeline execution failed unexpectedly"
        },
        { status: 400 }
      )
    );
  }
}
