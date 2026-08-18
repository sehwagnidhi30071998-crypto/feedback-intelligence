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
- Auth route guard lives in `proxy.ts` (named export `proxy`; middleware.ts was renamed in Next 16). `cookies()` is async — always `await cookies()`.

## Auth

- Auth is Supabase Auth (email/password) via `@supabase/ssr`. Server access: `createClient()` / `getCurrentUser()` from `lib/supabase-server.ts`; browser: `createBrowserClient` in `lib/supabase-browser.ts`. Server actions authenticate with `auth.getUser()`.
- `proxy.ts` redirects signed-out visitors to `/login`; `/login` and `/signup` pages (`app/login`, `app/signup`) use `components/LoginForm.tsx` / `components/SignupForm.tsx` and `lib/auth-actions.ts` (`signIn`, `signUp` with email-confirm, `signOut`). Root `app/layout.tsx` passes `userEmail` to `components/Navbar.tsx` (sign-out form) and sets `robots: { index: false }`; `app/robots.ts` disallows all.
- Production Supabase project: URL `https://bompizbtetlsrmkcbnyw.supabase.co`; env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Old dev project `pmvfpcmnkmxntbsgsyer` holds legacy data.

## Data & AI

- Tables (`supabase/migrations/0001_init.sql` + `0002_auth.sql`): `meetings` (has `created_by uuid default auth.uid()`), `transcripts`, `feedback`, `jira_tickets` (has `jira_connection_id`), `jira_connections`. RLS is ENABLED: shared-workspace tables allow all `authenticated` users (every signed-in user sees all data); `jira_connections` is owner-only (policies `auth.uid() = user_id`).
- Jira tokens are stored encrypted (pgcrypto) in `jira_connections.token_enc` and decrypted only by a `security definer` function `decrypt_jira_token` (checks `auth.uid() = user_id`). `save_jira_connection` RPC encrypts with the server-side key `JIRA_TOKEN_KEY`. In dev that key lives in `.env.local`; in production set it as a Vercel env var.
- AI analysis is `lib/ai.ts` (server-only). Env vars: `GROQ_API_KEY` (required), `AI_BASE_URL` (default Groq), `AI_MODEL` (default `openai/gpt-oss-120b`). Provider is swappable via these env vars. NOTE: the model list must be checked via Groq's `/models` endpoint — common model IDs like `llama-3.3-70b-versatile` may not exist on the account.
- Server actions live in `lib/actions.ts`; the Add Meeting form distinguishes Save vs Analyze via a submit button named `intent` with values `save`/`analyze` (`components/FormButtons.tsx`).
- Review workflow: `/feedback/[id]` shows an editable form (`components/FeedbackReviewForm.tsx`); `updateFeedback` in `lib/actions.ts` reads a submit button named `action` with values `save`/`approve`/`reject`/`duplicate`/`jira`. Canonical `review_status` values are `pending`/`approved`/`rejected`/`duplicate` (badges + Dashboard counts depend on these). The `jira` action saves edits, verifies status is `approved` and no ticket exists, reads `connection_id` from the form, decrypts that connection's token, calls `createJiraTicket`, and inserts into `jira_tickets`.

## Jira

- `lib/jira.ts` (server-only) talks to Jira Cloud REST v3 (`/rest/api/3/issue`). Auth is HTTP Basic with base64(`email:api_token`) — no global Jira env vars; each user connects their own workspaces in `/settings` (`components/JiraConnectionForm.tsx`, `saveJiraConnection`/`deleteJiraConnection` actions). `testJiraConnection` verifies `/rest/api/3/myself` + project key before saving.
- Tickets are created in the workspace's project; the **description must be Atlassian Document Format (ADF) JSON** — plain text is rejected with a 400. `createJiraTicket` builds ADF blocks from feedback fields. Created ticket is stored in `jira_tickets` (unique per `feedback_id`) with `jira_connection_id`, `ticket_key`, `ticket_url`, and `status` fetched back from Jira.
- Issue type is mapped from the feedback `type` (`jiraIssueTypeFor` in `lib/jira.ts`): Bug/Data Issue/Performance Issue/Existing Issue → `Bug`, Feature Request/Logic Change/UX Improvement → `Story`, Domain Knowledge/Other → `Task`; unknown falls back to the connection's `issue_type` (default `Task`).
- The user's own site `zoologymini.atlassian.net` creates tickets in the software project **KAN "Feedback implementation"** (has Epic/Story/Task/Bug; new tickets start in "To Do"). The service-desk project FP (only issuetype `Email request`) exists but is not used.
- Only approved feedback can create a ticket (enforced server-side in `updateFeedback`; the picker renders only when `approved` + no ticket + the user has at least one connection).

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; also runs the TypeScript check (there is no separate `typecheck` script)
- `npm run lint` — ESLint (flat config `eslint.config.mjs`)
- No test framework is set up.
