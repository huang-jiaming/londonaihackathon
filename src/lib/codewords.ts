import type {
  CodeWordsExportPayload,
  GitHubIssueDraft,
  StructuredOutput
} from "@/lib/types";

function buildFallbackDrafts(structured: StructuredOutput): GitHubIssueDraft[] {
  return structured.tickets.map((ticket) => ({
    title: `[${ticket.priority}] ${ticket.title}`,
    body: [
      "## Description",
      ticket.description,
      "",
      "## Acceptance Criteria",
      ...ticket.acceptanceCriteria.map((criterion) => `- ${criterion}`),
      "",
      "## Metadata",
      `- Category: ${ticket.category}`,
      `- Effort: ${ticket.effort}`,
      `- Source Ticket ID: ${ticket.id}`
    ].join("\n"),
    labels: [ticket.priority, ticket.category, ticket.effort, "repo-surgeon"]
  }));
}

function parseCodeWordsResponse(
  response: unknown,
  structured: StructuredOutput
): CodeWordsExportPayload {
  const fallbackPayload: CodeWordsExportPayload = {
    githubIssuesPayload: buildFallbackDrafts(structured),
    slackMessagePayload: {
      text: `Repo Surgeon generated ${structured.tickets.length} tickets.`
    }
  };

  if (!response || typeof response !== "object") {
    return fallbackPayload;
  }

  const asRecord = response as Record<string, unknown>;
  const draftList =
    (asRecord.githubIssuesPayload as GitHubIssueDraft[] | undefined) ??
    (asRecord.issues as GitHubIssueDraft[] | undefined) ??
    undefined;
  const slackPayload =
    (asRecord.slackMessagePayload as { text?: string; blocks?: unknown[] } | undefined) ??
    undefined;

  return {
    githubIssuesPayload:
      Array.isArray(draftList) && draftList.length > 0
        ? draftList
        : fallbackPayload.githubIssuesPayload,
    slackMessagePayload: {
      text: slackPayload?.text || fallbackPayload.slackMessagePayload.text,
      blocks: slackPayload?.blocks
    }
  };
}

export async function runCodeWordsWorkflow(
  structured: StructuredOutput
): Promise<CodeWordsExportPayload> {
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

  const json = (await response.json()) as unknown;
  return parseCodeWordsResponse(json, structured);
}
