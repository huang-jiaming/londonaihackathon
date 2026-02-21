import { NextRequest, NextResponse } from "next/server";
import { handleOptions, rejectDisallowedOrigin, withCors } from "@/lib/cors";
import { step3StructureWithDust } from "@/lib/steps";
import type { ActionItems } from "@/lib/types";

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as ActionItems;
    if (!body.actions) {
      throw new Error("Missing actions payload");
    }

    const structured = await step3StructureWithDust(body);
    return withCors(request, NextResponse.json(structured));
  } catch (error) {
    return withCors(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Step 3 structuring failed unexpectedly"
        },
        { status: 400 }
      )
    );
  }
}
