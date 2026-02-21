# Step 1 Spec - Ingest and Review

## Owner
Riley Yanicki

## Endpoint
`POST /api/ingest`

## Purpose
Convert repo URL or pasted code into structured analysis using Gemini.

## Input
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "codeInput": "optional raw code string",
  "language": "python"
}
```

At least one of `repoUrl` or `codeInput` is required.

## Output
```json
{
  "summary": "string",
  "architecture": "string",
  "fileBreakdown": "string",
  "legacyPatterns": "string",
  "dependencies": "string",
  "concerns": "string"
}
```

## Cursor Agent Task Prompt
Use this prompt in Cursor Agent:

```text
Implement Step 1 in src/lib/steps.ts and src/app/api/ingest/route.ts.
Requirements:
- Accept repoUrl or codeInput.
- If repoUrl provided, fetch file tree and text files from GitHub API.
- Cap content size to prevent token overflow.
- Call Gemini and return ONLY JSON matching RepoAnalysis.
- Add clear error messages for invalid repo URL, API errors, and empty content.
- Keep endpoint response strictly in the agreed schema.
```
