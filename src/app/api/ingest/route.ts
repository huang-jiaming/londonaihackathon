import { NextRequest, NextResponse } from "next/server";
import { step1IngestAndReview } from "@/lib/steps";
import { handleOptions, rejectDisallowedOrigin, withCors } from "@/lib/cors";

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      repoUrl?: string;
      codeInput?: string;
    };
    const analysis = await step1IngestAndReview(body);
    return withCors(request, NextResponse.json(analysis));
  } catch (error) {
    return withCors(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Step 1 ingest failed unexpectedly"
        },
        { status: 400 }
      )
    );
  }
}
