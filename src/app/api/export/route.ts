import { NextRequest, NextResponse } from "next/server";
import { handleOptions, rejectDisallowedOrigin, withCors } from "@/lib/cors";
import { step4ExportWithCodeWords } from "@/lib/steps";
import type { ExportRequest, RepoContext, StructuredOutput } from "@/lib/types";

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as StructuredOutput | ExportRequest;
    const structured = "structured" in body ? body.structured : body;
    const repoContext: RepoContext | undefined = "structured" in body ? body.repoContext : undefined;

    if (!structured.tickets || !Array.isArray(structured.tickets)) {
      throw new Error("Missing tickets payload");
    }
    const exported = await step4ExportWithCodeWords(structured, repoContext);
    return withCors(request, NextResponse.json(exported));
  } catch (error) {
    return withCors(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Step 4 export failed unexpectedly"
        },
        { status: 400 }
      )
    );
  }
}
