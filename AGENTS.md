<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Feedback Intelligence

Next.js 16.3.1 (Turbopack) + React 19 + TypeScript + Tailwind v4 + ESLint 9. Fresh `create-next-app` scaffold.

## Environment (Windows)

- Node.js is installed at `C:\Program Files\nodejs` but NOT on `PATH`, and PowerShell execution policy blocks `.ps1` shims. Use the `.cmd` binaries directly:
  ```powershell
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
  & "C:\Program Files\nodejs\npm.cmd" run dev
  ```
  Plain `npm`/`npx` fail with `CommandNotFoundException` or `SecurityError`.
- This is not a git repository (no `.git`). Don't run `git` commands expecting a repo.

## Layout & conventions

- NO `src/` directory — app router code lives at the repo root in `app/`.
- Import alias `@/*` maps to `./*` (repo root), NOT `./src/*`: `@/components/x` → `components/x`.
- Tailwind v4 has NO `tailwind.config.*` file. Theme is configured in CSS via `@theme` in `app/globals.css` (`@import "tailwindcss"` + `@tailwindcss/postcss` plugin).
- Generated/ignored: `.next/`, `next-env.d.ts`. New route files in `app/` need `app/globals.css` imported in the root `app/layout.tsx`.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; also runs the TypeScript check (there is no separate `typecheck` script)
- `npm run lint` — ESLint (flat config `eslint.config.mjs`)
- No test framework is set up.
