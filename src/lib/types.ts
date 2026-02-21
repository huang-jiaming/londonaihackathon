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
  provider: "codewords" | "local-fallback";
  rawResponse?: unknown;
  csvContent?: string;
  notes?: string;
}

export interface IngestInput {
  repoUrl?: string;
  codeInput?: string;
  language?: string;
}
