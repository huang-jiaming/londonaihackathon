# Step 3 Spec - Structure with Dust

## Owner
Krysten Zissos

## Endpoint
`POST /api/structure`

## Purpose
Transform Step 2 free-text actions into strict ticket JSON via Dust agent.

## Input
```json
{
  "actions": "string",
  "verificationNotes": "string"
}
```

## Output
```json
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
```

## Dust Agent Setup
Create agent `repo-structurer` with system instruction:
Return only valid JSON matching the exact schema above. No markdown and no prose outside JSON.

## Cursor Agent Task Prompt
```text
Implement Step 3 in src/lib/steps.ts and src/app/api/structure/route.ts.
Requirements:
- Call Dust conversation endpoint with blocking=true.
- Mention configured Dust agent ID.
- Parse JSON safely from Dust output (handle extra text wrappers).
- Validate required fields for tickets and summary.
- Return precise StructuredOutput contract.
```

## Done Criteria
- Output is parseable JSON every run.
- Tickets are deduplicated and prioritized.
