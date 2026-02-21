import { NextRequest, NextResponse } from "next/server";
import { step1IngestAndReview } from "@/lib/steps";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      repoUrl?: string;
      codeInput?: string;
      language?: string;
    };
    const analysis = await step1IngestAndReview(body);
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Step 1 ingest failed unexpectedly"
      },
      { status: 400 }
    );
  }
}
