import { runCodeWordsWorkflow } from "@/lib/codewords";
import { runDustAgent } from "@/lib/dust";
import { runGeminiPrompt } from "@/lib/gemini";
import type {
  ActionItems,
  ExportResult,
  IngestInput,
  RepoAnalysis,
  StructuredOutput
} from "@/lib/types";

function parseGitHubRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }
  return { owner: match[1], repo: match[2] };
}

async function fetchGitHubRepoText(repoUrl: string): Promise<string> {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};

  const branches = ["main", "master"];
  let treeJson: Record<string, unknown> | null = null;
  for (const branch of branches) {
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    if (treeResponse.ok) {
      treeJson = (await treeResponse.json()) as Record<string, unknown>;
      break;
    }
  }

  if (!treeJson) {
    throw new Error("Could not read repo tree from GitHub API");
  }

  const tree = (treeJson.tree as Array<Record<string, unknown>> | undefined) ?? [];
  const files = tree
    .filter((node) => node.type === "blob")
    .map((node) => String(node.path ?? ""))
    .filter((path) => {
      const lower = path.toLowerCase();
      const ignored =
        lower.includes("node_modules/") ||
        lower.includes(".next/") ||
        lower.includes("dist/") ||
        lower.includes("build/") ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".pdf") ||
        lower.endsWith(".zip") ||
        lower.endsWith(".lock");
      return !ignored;
    })
    .slice(0, 25);

  let combined = "";
  for (const path of files) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    const altRawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`;

    let content = "";
    let fileResponse = await fetch(rawUrl, { headers });
    if (!fileResponse.ok) {
      fileResponse = await fetch(altRawUrl, { headers });
    }
    if (fileResponse.ok) {
      content = await fileResponse.text();
    }

    if (!content.trim()) continue;
    combined += `\n\n--- FILE: ${path} ---\n${content.slice(0, 4000)}`;
    if (combined.length > 120_000) {
      break;
    }
  }

  if (!combined.trim()) {
    throw new Error("No readable text files found in the repository");
  }

  return combined;
}

function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error("Could not parse JSON from model output");
  }
}

export async function step1IngestAndReview(
  input: IngestInput
): Promise<RepoAnalysis> {
  const sourceText = input.codeInput?.trim()
    ? input.codeInput.trim()
    : input.repoUrl
      ? await fetchGitHubRepoText(input.repoUrl)
      : "";

  if (!sourceText) {
    throw new Error("Provide either repoUrl or codeInput");
  }

  const prompt = `
You are a senior software architect reviewing legacy code.
Analyze the input and return ONLY valid JSON with this exact schema:
{
  "summary": "string",
  "architecture": "string",
  "fileBreakdown": "string",
  "legacyPatterns": "string",
  "dependencies": "string",
  "concerns": "string"
}

Input language hint: ${input.language ?? "unknown"}

Code/repo content:
${sourceText}
`.trim();

  const output = await runGeminiPrompt(prompt);
  return extractJson<RepoAnalysis>(output);
}

export async function step2GenerateActionItems(
  analysis: RepoAnalysis
): Promise<ActionItems> {
  const analysisText = Object.entries(analysis)
    .map(([key, value]) => `## ${key}\n${value}`)
    .join("\n\n");

  const generationPrompt = `
Based on this analysis, generate detailed free-text action items grouped by:
- Migration Tasks
- Testing Improvements
- Security Fixes
- Refactoring
- Documentation

For each item include: title, what to do, why it matters, suggested priority, and effort.

Analysis:
${analysisText}
`.trim();

  const rawActions = await runGeminiPrompt(generationPrompt);

  const verifyPrompt = `
You are reviewing an action plan for quality and correctness.
Compare the plan against the original analysis.

Return plain text with exactly these section headers:
VERIFIED_ACTIONS:
<improved free-text action items>

VERIFICATION_NOTES:
<what you changed and why>

Original analysis:
${analysisText}

Action plan:
${rawActions}
`.trim();

  const verifiedOutput = await runGeminiPrompt(verifyPrompt);
  const [actionsPart, notesPart = ""] = verifiedOutput.split("VERIFICATION_NOTES:");
  const actions = actionsPart.replace("VERIFIED_ACTIONS:", "").trim();
  const verificationNotes = notesPart.trim();

  return {
    actions: actions || rawActions,
    verificationNotes
  };
}

export async function step3StructureWithDust(
  actions: ActionItems
): Promise<StructuredOutput> {
  const prompt = `
Structure these action items into JSON.
Return ONLY valid JSON:
{
  "tickets": [
    {
      "id": "string",
      "priority": "P0|P1|P2|P3",
      "title": "string",
      "description": "string",
      "category": "migration|testing|refactor|security|documentation",
      "effort": "small|medium|large",
      "acceptanceCriteria": ["string"]
    }
  ],
  "summary": "string"
}

Action items:
${actions.actions}

Verification notes:
${actions.verificationNotes}
`.trim();

  const output = await runDustAgent(prompt);
  return extractJson<StructuredOutput>(output);
}

function toCsv(structured: StructuredOutput): string {
  const header =
    "id,priority,title,description,category,effort,acceptanceCriteria\n";
  const rows = structured.tickets.map((ticket) => {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    return [
      escape(ticket.id),
      escape(ticket.priority),
      escape(ticket.title),
      escape(ticket.description),
      escape(ticket.category),
      escape(ticket.effort),
      escape(ticket.acceptanceCriteria.join(" | "))
    ].join(",");
  });
  return `${header}${rows.join("\n")}`;
}

export async function step4ExportWithCodeWords(
  structured: StructuredOutput
): Promise<ExportResult> {
  try {
    const rawResponse = await runCodeWordsWorkflow(structured);
    return {
      success: true,
      ticketsCreated: structured.tickets.length,
      provider: "codewords",
      rawResponse
    };
  } catch (error) {
    return {
      success: false,
      ticketsCreated: structured.tickets.length,
      provider: "local-fallback",
      csvContent: toCsv(structured),
      notes:
        error instanceof Error
          ? `CodeWords failed, generated local CSV fallback: ${error.message}`
          : "CodeWords failed, generated local CSV fallback."
    };
  }
}
