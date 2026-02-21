interface DustMention {
  configurationId: string;
}

interface DustMessage {
  content: string;
  mentions: DustMention[];
  context: {
    timezone: string;
    profilePictureUrl: null;
  };
}

interface DustConversationRequest {
  visibility: "unlisted";
  title: string;
  message: DustMessage;
  blocking: boolean;
}

export async function runDustAgent(content: string): Promise<string> {
  const apiKey = process.env.DUST_API_KEY;
  const workspaceId = process.env.DUST_WORKSPACE_ID;
  const agentId = process.env.DUST_AGENT_ID;

  if (!apiKey || !workspaceId || !agentId) {
    throw new Error("Missing DUST_API_KEY, DUST_WORKSPACE_ID, or DUST_AGENT_ID");
  }

  const body: DustConversationRequest = {
    visibility: "unlisted",
    title: "Repo Surgeon Structuring",
    message: {
      content,
      mentions: [{ configurationId: agentId }],
      context: {
        timezone: "Europe/London",
        profilePictureUrl: null
      }
    },
    blocking: true
  };

  const response = await fetch(
    `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dust request failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const outputCandidate =
    (json.output as string | undefined) ??
    (json.answer as string | undefined) ??
    JSON.stringify(json);

  return outputCandidate;
}
