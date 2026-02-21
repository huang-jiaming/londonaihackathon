# Step 4 Spec - CodeWords Orchestration + GitHub Issues + Slack

## Owner
Erdinc Mutlu

## Endpoint
`POST /api/export`

## Purpose
Use CodeWords in the critical path to transform structured tickets, then deliver to GitHub Issues and Slack.

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
  "issuesCreatedCount": 12,
  "issueLinks": ["https://github.com/owner/repo/issues/123"],
  "slackStatus": "sent",
  "slackMessageTsOrId": "optional",
  "provider": "codewords",
  "rawResponse": {}
}
```

Fallback output when external call fails:
```json
{
  "success": false,
  "ticketsCreated": 12,
  "issuesCreatedCount": 0,
  "issueLinks": [],
  "slackStatus": "failed",
  "provider": "fallback",
  "csvContent": "id,priority,...",
  "notes": "CodeWords/GitHub/Slack failed, generated local CSV fallback"
}
```

## Cursor Agent Task Prompt
```text
Implement Step 4 in src/lib/steps.ts and src/app/api/export/route.ts.
Requirements:
- Call CodeWords sync run endpoint first with tickets + summary payload.
- Expect CodeWords output to include githubIssuesPayload[] and slackMessagePayload.
- Create GitHub issues using GitHub REST API with GITHUB_ISSUES_TOKEN.
- Send Slack summary with SLACK_WEBHOOK_URL.
- Return unified delivery status: issue links + slack status + notes.
- Add robust partial-failure handling and always return CSV fallback.
```

## Done Criteria
- Success path calls real CodeWords service and creates GitHub issues.
- Slack notification posts with issue links.
- Failure path still gives usable export artifact and clear notes.
