<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Feedback Intelligence

Next.js 16.3.1 (Turbopack) + React 19 + TypeScript + Tailwind v4 + ESLint 9. Next.js 16.3.1 (Turbopack). Data: Supabase (Postgres). AI: Groq (open-source models).

## Environment (Windows)

- Node.js is installed at `C:\Program Files\nodejs` but NOT on `PATH`, and PowerShell execution policy blocks `.ps1` shims. Use the `.cmd` binaries directly:
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  & "C:\Program Files\nodejs\npm.cmd" run dev
  ```
  Plain `npm`/`npx` fail with `CommandNotFoundException` or `SecurityError`.
- `git` is NOT on `PATH` either — use `& "C:\Program Files\Git\cmd\git.exe" ...`. The GitHub CLI lives at `& "C:\Program Files\GitHub CLI\gh.exe" ...` and needs `git` on `PATH` to detect the repo (add `C:\Program Files\Git\cmd` to `$env:Path` first).
- This IS a git repository (private repo `sehwagnidhi30071998-crypto/feedback-intelligence`).

## Layout & conventions

- NO `src/` directory — app router code lives at the repo root in `app/`.
- Import alias `@/*` maps to `./*` (repo root), NOT `./src/*`: `@/components/x` → `components/x`.
- Tailwind v4 has NO `tailwind.config.*` file. Theme is configured in CSS via `@theme` in `app/globals.css` (`@import "tailwindcss"` + `@tailwindcss/postcss` plugin).
- Generated/ignored: `.next/`, `next-env.d.ts`. New route files in `app/` need `app/globals.css` imported in the root `app/layout.tsx`.

## Data & AI

- Supabase client is `lib/supabase.ts`; env vars in `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Tables (created via `supabase/migrations/0001_init.sql`): `meetings`, `transcripts`, `feedback`, `jira_tickets`. RLS is DISABLED (no auth yet) — when auth is added, re-enable RLS + policies.
- AI analysis is `lib/ai.ts` (server-only). Env vars: `GROQ_API_KEY` (required), `AI_BASE_URL` (default Groq), `AI_MODEL` (default `openai/gpt-oss-120b`). Provider is swappable via these env vars. NOTE: the model list must be checked via Groq's `/models` endpoint — common model IDs like `llama-3.3-70b-versatile` may not exist on the account.
- Server actions live in `lib/actions.ts`; the Add Meeting form distinguishes Save vs Analyze via a submit button named `intent` with values `save`/`analyze` (`components/FormButtons.tsx`).
- Review workflow: `/feedback/[id]` shows an editable form (`components/FeedbackReviewForm.tsx`); `updateFeedback` in `lib/actions.ts` reads a submit button named `action` with values `save`/`approve`/`reject`/`duplicate`/`jira`. Canonical `review_status` values are `pending`/`approved`/`rejected`/`duplicate` (badges + Dashboard counts depend on these). The `jira` action saves edits, verifies status is `approved` and no ticket exists, then calls `createJiraTicket` and inserts into `jira_tickets`.

## Jira

- `lib/jira.ts` (server-only) talks to Jira Cloud REST v3 (`/rest/api/3/issue`). Env vars in `.env.local` (gitignored): `JIRA_SITE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, plus `JIRA_ISSUE_TYPE` (default `Task`; this site's project needs `Email request`). Auth is HTTP Basic with base64(`email:api_token`). `isJiraConfigured()` gates the UI.
- Tickets are created in the configured project; the **description must be Atlassian Document Format (ADF) JSON** — plain text is rejected with a 400. `createJiraTicket` builds ADF blocks from feedback fields. Created ticket is stored in `jira_tickets` (unique per `feedback_id`), with `ticket_key`, `ticket_url`, and `status` fetched back from Jira.
- Issue type is mapped from the feedback `type` (`jiraIssueTypeFor` in `lib/jira.ts`): Bug/Data Issue/Performance Issue/Existing Issue → `Bug`, Feature Request/Logic Change/UX Improvement → `Story`, Domain Knowledge/Other → `Task`; unknown falls back to `JIRA_ISSUE_TYPE` (default `Task`).
- The connected site `zoologymini.atlassian.net` creates tickets in the software project **KAN "Feedback implementation"** (has Epic/Story/Task/Bug; new tickets start in "To Do"). The service-desk project FP (only issuetype `Email request`) exists but is not used.
- Only approved feedback can create a ticket (enforced server-side in `updateFeedback`, button only rendered for `approved` + no ticket + `isJiraConfigured()`).

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; also runs the TypeScript check (there is no separate `typecheck` script)
- `npm run lint` — ESLint (flat config `eslint.config.mjs`)
- No test framework is set up.
