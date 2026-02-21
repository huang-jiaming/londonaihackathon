# Deploy to GitHub Pages (Production)

GitHub Pages can only host static frontend files. It cannot run Next.js API routes.

For this project, deploy in two parts:
- **Backend API** (`/api/*`) on Render/Railway/Vercel
- **Frontend UI** on GitHub Pages, configured to call backend with `NEXT_PUBLIC_API_BASE_URL`

## 1) Deploy backend first

Deploy the current Next.js app to a runtime host (recommended: Vercel or Render).

### Exact Vercel backend setup

1. Go to https://vercel.com/new and import this GitHub repository.
2. Framework preset: `Next.js`.
3. Root directory: repository root.
4. Build command: default (`next build`).
5. Output directory: default (empty).
6. Add Environment Variables (Production scope):
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
   - optional `GITHUB_TOKEN`
7. Click Deploy.
8. Save the deployed API origin (example: `https://repo-surgeon-api.vercel.app`).

Important: keep `STATIC_EXPORT` unset on Vercel backend deploys. In this repo, static export is now opt-in and only enabled when `STATIC_EXPORT=true`.

You must have these backend env vars set on that host:
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
- optional `GITHUB_TOKEN`

After deploy, note backend URL, for example:
`https://repo-surgeon-api.onrender.com`

## 2) Set frontend API base URL

For GitHub Pages frontend build:
- `NEXT_PUBLIC_API_BASE_URL=https://repo-surgeon-api.onrender.com`

## 3) Build static frontend for Pages

Because this repository contains server API routes, the safest hackathon path is:
- keep backend in this repo deployed to runtime host
- create a lightweight frontend-only Pages deploy branch/folder

Fast option:
1. Keep using this Next.js frontend locally and in backend host.
2. For GitHub Pages, create a static wrapper app (or separate small frontend repo) that calls:
   - `POST {NEXT_PUBLIC_API_BASE_URL}/api/ingest`
   - `POST {NEXT_PUBLIC_API_BASE_URL}/api/generate-actions`
   - `POST {NEXT_PUBLIC_API_BASE_URL}/api/structure`
   - `POST {NEXT_PUBLIC_API_BASE_URL}/api/export`

If you still want to attempt Next static export directly from this repo, verify locally first:
- `npm run build:static`
- ensure export succeeds with your Next version/config and does not include server route handlers.

## 4) Enable GitHub Pages

In GitHub:
1. Repo `Settings` -> `Pages`
2. `Build and deployment` -> `Source: GitHub Actions`
3. Add a workflow that publishes your static frontend build output to Pages.

Auth note:
- Standard Pages workflows should use the built-in `GITHUB_TOKEN`.
- You only need a custom PAT when publishing to a different repository.

### GitHub Pages deployment variables/secrets
- Build-time variable:
  - `NEXT_PUBLIC_API_BASE_URL=https://your-vercel-backend-domain`
- If your workflow requires repository/environment secrets, add in:
  - `Settings` -> `Secrets and variables` -> `Actions`

## 5) CORS requirement

Your backend host must allow your Pages origin:
- `https://huang-jiaming.github.io`
- or `https://huang-jiaming.github.io/londonaihackathon` (repo pages)

Without CORS, browser calls from Pages to backend APIs will fail.

## 6) Production smoke test

From deployed Pages URL:
1. Use sample input
2. Run sequential flow
3. Confirm all 4 steps return
4. Confirm Step 4 creates GitHub Issues and sends Slack message
5. Confirm fallback still works if CodeWords or delivery targets fail

## Token source quick reference

### CodeWords API key
- Source: CodeWords dashboard key management page.
- Store in backend as `CODEWORDS_API_KEY`.

### GitHub Issues token
- Source: GitHub -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens -> Generate new token.
- Minimum repo permissions: `Issues` (Read and write).
- Store in backend as `GITHUB_ISSUES_TOKEN`.

Token creation details:
- Resource owner: your user or org that owns the target repo.
- Repository access: select only target issue repo.
- Permissions:
  - Repository permissions -> `Issues`: Read and write.
  - `Metadata` is read-only by default and sufficient.

### Slack webhook URL
- Source: https://api.slack.com/apps -> create app -> Incoming Webhooks -> activate -> Add New Webhook to Workspace.
- Store in backend as `SLACK_WEBHOOK_URL`.

### Vercel token (optional for CLI/CI deploy)
- Source: Vercel Dashboard -> Settings -> Tokens.
- Needed only for CLI-driven deployment workflows.

When needed, store as GitHub Action secret:
- `VERCEL_TOKEN`
- (if using `vercel pull`/`vercel deploy`) also store `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
