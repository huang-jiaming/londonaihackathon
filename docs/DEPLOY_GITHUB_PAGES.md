# Deploy to GitHub Pages (Production)

GitHub Pages can only host static frontend files. It cannot run Next.js API routes.

For this project, deploy in two parts:
- **Backend API** (`/api/*`) on Render/Railway/Vercel
- **Frontend UI** on GitHub Pages, configured to call backend with `NEXT_PUBLIC_API_BASE_URL`

## 1) Deploy backend first

Deploy the current Next.js app to a runtime host (recommended: Vercel or Render).

You must have these backend env vars set on that host:
- `GEMINI_API_KEY`
- `DUST_API_KEY`
- `DUST_WORKSPACE_ID`
- `DUST_AGENT_ID`
- `CODEWORDS_API_KEY`
- `CODEWORDS_SERVICE_ID`
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
- `npm run build`
- ensure export succeeds with your Next version/config and does not include server route handlers.

## 4) Enable GitHub Pages

In GitHub:
1. Repo `Settings` -> `Pages`
2. `Build and deployment` -> `Source: GitHub Actions`
3. Add a workflow that publishes your static frontend build output to Pages.

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
4. Confirm Step 4 fallback still works if CodeWords is unavailable
