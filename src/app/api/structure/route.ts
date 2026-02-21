import { NextRequest, NextResponse } from "next/server";
import { step3StructureWithDust } from "@/lib/steps";
import type { ActionItems } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActionItems;
    if (!body.actions) {
      throw new Error("Missing actions payload");
    }

    const structured = await step3StructureWithDust(body);
    return NextResponse.json(structured);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Step 3 structuring failed unexpectedly"
      },
      { status: 400 }
    );
  }
}
