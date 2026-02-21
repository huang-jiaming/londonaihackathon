# Step 4 Spec - Export with CodeWords

## Owner
Erdinc Mutlu

## Endpoint
`POST /api/export`

## Purpose
Send structured tickets to CodeWords automation and return export status.

## Input
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

## Output
```json
{
  "success": true,
  "ticketsCreated": 12,
  "provider": "codewords",
  "rawResponse": {}
}
```

Fallback output when external call fails:
```json
{
  "success": false,
  "ticketsCreated": 12,
  "provider": "local-fallback",
  "csvContent": "id,priority,...",
  "notes": "CodeWords failed, generated local CSV fallback"
}
```

## Cursor Agent Task Prompt
```text
Implement Step 4 in src/lib/steps.ts and src/app/api/export/route.ts.
Requirements:
- Call CodeWords sync run endpoint with tickets + summary payload.
- Return normalized ExportResult contract.
- Add robust handling for API failures and non-200 responses.
- Always provide fallback CSV so demo does not fail.
```

## Done Criteria
- Success path calls real CodeWords service.
- Failure path still gives usable export artifact.
