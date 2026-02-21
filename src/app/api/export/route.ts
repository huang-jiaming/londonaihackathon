import { NextRequest, NextResponse } from "next/server";
import { step4ExportWithCodeWords } from "@/lib/steps";
import type { StructuredOutput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StructuredOutput;
    if (!body.tickets || !Array.isArray(body.tickets)) {
      throw new Error("Missing tickets payload");
    }
    const exported = await step4ExportWithCodeWords(body);
    return NextResponse.json(exported);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Step 4 export failed unexpectedly"
      },
      { status: 400 }
    );
  }
}
