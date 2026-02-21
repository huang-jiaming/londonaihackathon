# Cursor Handoff Playbook

Use this file to split work immediately with Cursor agents.

## Branching
- `main` keeps integration-ready code.
- Each teammate uses one short-lived branch:
  - `feat/step1-ingest`
  - `feat/step2-actions`
  - `feat/step3-structure`
  - `feat/step4-export`

## Shared Contracts
- Shared types: `src/lib/types.ts`
- Service logic: `src/lib/steps.ts`
- API wrappers:
  - `src/app/api/ingest/route.ts`
  - `src/app/api/generate-actions/route.ts`
  - `src/app/api/structure/route.ts`
  - `src/app/api/export/route.ts`
- Full orchestration route: `src/app/api/pipeline/route.ts`
- Frontend orchestrator: `src/app/page.tsx`

## Agent Prompts

### Riley (Step 1)
See `docs/STEP1_SPEC.md` and run that prompt as-is.

### Carter (Step 2)
See `docs/STEP2_SPEC.md` and run that prompt as-is.

### Krysten (Step 3)
See `docs/STEP3_SPEC.md` and run that prompt as-is.

### Erdinc (Step 4)
See `docs/STEP4_SPEC.md` and run that prompt as-is.

## Integration Checklist
1. Confirm `.env.local` has all required keys from `.env.example`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `/` and click `Run steps 1→4 via UI orchestration`.
5. Verify each step payload renders.
6. If Step 4 fails externally, confirm fallback CSV is returned.
