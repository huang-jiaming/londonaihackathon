# Integration Review and Runbook

This document is the single review checklist before demo and submission.

## 1) Target architecture

Step order must remain:
1. `POST /api/ingest` (Gemini)
2. `POST /api/generate-actions` (Gemini)
3. `POST /api/structure` (Dust)
4. `POST /api/export` (CodeWords -> GitHub Issues + Slack)

CodeWords is required in Step 4 before issue/slack delivery.

## 2) Environment variables

Copy template:

```bash
cp .env.example .env.local
```

Required:
- `GEMINI_API_KEY`
- `DUST_API_KEY`
- `DUST_WORKSPACE_ID`
- `DUST_AGENT_ID`
- `CODEWORDS_API_KEY`
- `CODEWORDS_SERVICE_ID`
- `GITHUB_ISSUES_TOKEN`
- `GITHUB_ISSUES_OWNER`
- `GITHUB_ISSUES_REPO`
- `SLACK_WEBHOOK_URL`

Optional:
- `GITHUB_TOKEN` (repo ingest rate limit help)
- `NEXT_PUBLIC_API_BASE_URL` (for GitHub Pages frontend build)

## 3) Where to find each token

### CodeWords
- Open CodeWords dashboard key page.
- Create/reuse key and set `CODEWORDS_API_KEY`.
- Get workflow/service id and set `CODEWORDS_SERVICE_ID`.

### Dust
- Open Dust workspace.
- Create/get API key -> `DUST_API_KEY`.
- Workspace ID -> `DUST_WORKSPACE_ID`.
- Agent configuration ID -> `DUST_AGENT_ID`.

### GitHub Issues
- GitHub -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens.
- Generate token for target repo.
- Grant repository permission: `Issues` read/write.
- Save as `GITHUB_ISSUES_TOKEN`.
- Set repo coordinates:
  - `GITHUB_ISSUES_OWNER`
  - `GITHUB_ISSUES_REPO`

### Slack
- https://api.slack.com/apps -> Create app.
- Incoming Webhooks -> Activate -> Add New Webhook to Workspace.
- Copy URL -> `SLACK_WEBHOOK_URL`.

### Vercel (optional token)
- Vercel Dashboard -> Settings -> Tokens.
- Only needed for CLI/CI-based deployments, not basic Git integration deploy.

### GitHub Pages token model
- Use built-in GitHub Actions `GITHUB_TOKEN` for same-repo Pages deployment.
- Custom PAT only needed for cross-repo publish patterns.

## 4) Local integration test

Run:

```bash
npm install
npm run dev
```

Test in UI:
1. Load sample input.
2. Run `Run steps 1→4 via UI orchestration`.
3. Verify each panel renders.
4. Verify Step 4 output includes:
   - provider
   - created issue links
   - slack delivery status
5. If external failure occurs, verify fallback includes `csvContent`.

## 5) Deployment plan

### Backend on Vercel
1. Import repository into Vercel.
2. Configure Production env vars listed above.
3. Deploy and capture backend URL.

### Frontend on GitHub Pages
1. Build/deploy static frontend via GitHub Actions Pages workflow.
2. Set `NEXT_PUBLIC_API_BASE_URL` to Vercel backend URL.
3. Confirm CORS on backend allows Pages origin.

## 6) UI acceptance criteria (Steve Jobs theme)

- Minimal black/white visual language.
- One primary CTA for pipeline run.
- Clear progressive disclosure from analysis to delivery.
- No noisy controls or dense dashboards.
- Every result section explains value in 1-2 lines.

## 7) Demo acceptance checklist

- Partner technologies visible in one run:
  - Gemini
  - Dust
  - CodeWords
- Delivery proof:
  - GitHub Issues created live
  - Slack message sent live
- Fallback proof:
  - CSV artifact generated if delivery fails

## 8) Demo repo generation prompt

Use this prompt in a new Cursor window rooted at a separate folder:

```text
Create a fictional enterprise legacy codebase named legacy-insurance-suite in this folder.

Requirements:
- 80-120 files.
- Language mix: mostly Python, some Bash, small JavaScript utilities.
- Structure:
  - services/policy_admin/
  - services/claims/
  - services/billing/
  - batch/jobs/
  - etl/pipelines/
  - integrations/
  - shared/utils/
  - scripts/
  - tests/
  - docs/
- Legacy code smells intentionally included:
  - Some Python 2 style syntax and old exception handling.
  - Duplicate business logic across services.
  - Overly large classes and functions.
  - Outdated dependencies and stale configs.
  - Flaky tests and missing tests in critical workflows.
  - Hardcoded values and fragile cron scripts.
- Add docs:
  - README.md (state clearly this is fictional demo data)
  - docs/architecture.md (old architecture notes + known pain points)
  - CHANGELOG.md (entries from 2012-2021)
- Add sample CSV fixtures and config files.
- Code should be plausible and analyzable, but not necessarily fully runnable.

Finally output a short summary of intentional technical debt hotspots.
```
