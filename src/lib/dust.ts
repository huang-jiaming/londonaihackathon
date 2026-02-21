interface DustMention {
  configurationId: string;
}

interface DustContext {
  username: string;
  timezone: string;
  profilePictureUrl?: string | null;
}

interface DustMessage {
  content: string;
  mentions: DustMention[];
  context: DustContext;
}

interface DustConversationRequest {
  message: DustMessage;
  title?: string;
  blocking?: boolean;
  skipToolsValidation?: boolean;
}

function extractAgentOutput(json: Record<string, unknown>): string {
  // Convenience fields some API modes may return
  const direct =
    (json.output as string | undefined) ?? (json.answer as string | undefined);
  if (typeof direct === "string") return direct;

  // Parse per Conversation schema: conversation.content is array of message arrays
  const conv = json.conversation as Record<string, unknown> | undefined;
  const content = conv?.content as unknown[] | undefined;
  if (!Array.isArray(content)) return JSON.stringify(json);

  let lastAgentContent: string | undefined;
  for (const batch of content) {
    if (!Array.isArray(batch)) continue;
    for (const msg of batch) {
      const m = msg as Record<string, unknown>;
      if (m.type === "agent" && typeof m.content === "string") {
        lastAgentContent = m.content;
      }
    }
  }
  return lastAgentContent ?? JSON.stringify(json);
}

export async function runDustAgent(content: string): Promise<string> {
  const apiKey = process.env.DUST_API_KEY;
  const workspaceId = process.env.DUST_WORKSPACE_ID;
  const agentId = process.env.DUST_AGENT_ID;
  const baseUrl =
    process.env.DUST_API_BASE_URL ?? "https://dust.tt";

  if (!apiKey || !workspaceId || !agentId) {
    throw new Error("Missing DUST_API_KEY, DUST_WORKSPACE_ID, or DUST_AGENT_ID");
  }

  const body: DustConversationRequest = {
    message: {
      content,
      mentions: [{ configurationId: agentId }],
      context: {
        username: "repo-surgeon",
        timezone: "Europe/London",
        profilePictureUrl: null
      }
    },
    title: "Repo Surgeon Structuring",
    blocking: true
  };

  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/w/${workspaceId}/assistant/conversations`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dust request failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return extractAgentOutput(json);
}
