export type Priority = "P0" | "P1" | "P2" | "P3";
export type TicketCategory =
  | "migration"
  | "testing"
  | "refactor"
  | "security"
  | "documentation";
export type Effort = "small" | "medium" | "large";

export interface RepoAnalysis {
  summary: string;
  architecture: string;
  fileBreakdown: string;
  legacyPatterns: string;
  dependencies: string;
  concerns: string;
}

export interface ActionItems {
  actions: string;
  verificationNotes: string;
}

export interface StructuredTicket {
  id: string;
  priority: Priority;
  title: string;
  description: string;
  category: TicketCategory;
  effort: Effort;
  acceptanceCriteria: string[];
}

export interface StructuredOutput {
  tickets: StructuredTicket[];
  summary: string;
}

export interface ExportResult {
  success: boolean;
  ticketsCreated: number;
  slackStatus: "sent" | "failed" | "skipped";
  slackMessageTsOrId?: string;
  provider: "codewords" | "fallback";
  rawResponse?: unknown;
  csvContent?: string;
  notes?: string;
}

export interface GitHubIssueDraft {
  title: string;
  body: string;
  labels: string[];
}

export interface CodeWordsExportPayload {
  githubIssuesPayload: GitHubIssueDraft[];
  slackMessagePayload: {
    text: string;
    blocks?: unknown[];
  };
}

export interface RepoContext {
  repoName?: string;
  repoUrl?: string;
}

export interface ExportRequest {
  structured: StructuredOutput;
  repoContext?: RepoContext;
}

export interface IngestInput {
  repoUrl?: string;
  codeInput?: string;
}
