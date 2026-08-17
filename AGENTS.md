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

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; also runs the TypeScript check (there is no separate `typecheck` script)
- `npm run lint` — ESLint (flat config `eslint.config.mjs`)
- No test framework is set up.
