# Step 2 Spec - Generate Action Items + Verify

## Owner
Carter Huang

## Endpoint
`POST /api/generate-actions`

## Purpose
Turn Step 1 analysis into actionable free-text plan, then run a second Gemini verification pass.

## Input
```json
{
  "analysis": {
    "summary": "string",
    "architecture": "string",
    "fileBreakdown": "string",
    "legacyPatterns": "string",
    "dependencies": "string",
    "concerns": "string"
  }
}
```

## Output
```json
{
  "actions": "free-text grouped actions",
  "verificationNotes": "what changed and why"
}
```

## Processing Contract
1. Generate initial action plan from analysis.
2. Send plan + analysis back to Gemini for critique and correction.
3. Return improved `actions` and `verificationNotes`.

## Cursor Agent Task Prompt
```text
Implement Step 2 in src/lib/steps.ts and src/app/api/generate-actions/route.ts.
Requirements:
- Build two-prompt flow with Gemini: generate -> verify.
- Ensure output format is:
  { actions: string, verificationNotes: string }
- Keep categories explicit: migration, testing, security, refactor, docs.
- Add guardrails for missing analysis fields and malformed model output.
- Keep response concise enough for Step 3 structuring.
```

## Done Criteria
- Returns action text with clearly ranked tasks.
- Verification notes mention merges, missing items added, and priority adjustments.
