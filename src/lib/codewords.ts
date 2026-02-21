import type { StructuredOutput } from "@/lib/types";

export async function runCodeWordsWorkflow(
  structured: StructuredOutput
): Promise<unknown> {
  const apiKey = process.env.CODEWORDS_API_KEY;
  const serviceId = process.env.CODEWORDS_SERVICE_ID;

  if (!apiKey || !serviceId) {
    throw new Error("Missing CODEWORDS_API_KEY or CODEWORDS_SERVICE_ID");
  }

  const response = await fetch(`https://runtime.codewords.ai/run/${serviceId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tickets: structured.tickets,
      summary: structured.summary
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CodeWords request failed: ${response.status} ${text}`);
  }

  return response.json();
}
