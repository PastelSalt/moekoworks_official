@AGENTS.md

# Moesoft — working notes for Claude sessions

Portfolio of Kyle Zoleta under the name **Moesoft (Moeko Software and Technologies)**. The plan and every decision live in
`PRELIMENARYPLAN.md` (v0.3). Progress and the resume protocol live in `docs/PROGRESS.md`. Read both before changing anything.
**Adding a new project/website to the portfolio?** Follow `docs/NEW-PROJECT-PLAYBOOK.md` step by step (intake, capture,
admin shots, Cloudinary upload, seed, verify, ship) — it has the exact scripts, IDs and gotchas.

## Stack
Next.js 16.3 App Router (classic caching model: pre-rendered pages + `revalidatePath` after admin saves; Cache Components
is OFF) · React 19.2 · TypeScript · MUI 9 (Emotion, `@layer mui`) + CSS tokens/cascade layers in `src/theme` ·
GSAP + Lenis + canvas-confetti · Drizzle ORM on Neon (`drizzle-orm/neon-http`) · Cloudinary · Vercel (`sin1`).
Next 16 renamed middleware to `src/proxy.ts`. Read `node_modules/next/dist/docs/` before using an API you're unsure of.

## Hard rules (the owner's)
1. **Never write the admin username or password into tracked files** (code, SQL, docs, commits, logs). They live only in
   `.env.local` (git-ignored) and are read by `scripts/admin-seed.mts`. Vercel never needs them.
2. Never commit secrets: check `git diff --cached` + run the secret scan before every commit. Never force-push or skip hooks.
3. Commit + push after each verified task. Design branches merge into `main` only with the owner's explicit OK.
   Work happens on `dev`; pushes to `main` deploy production.
4. Content is archived, never hard-deleted (exceptions: Cloudinary files of deleted media, messages the owner deletes,
   operational retention).
5. One production database (owner's choice): test freely before launch, drafts only after; take a Neon restore point
   (branch/snapshot) before every schema change.
6. Never link any project's source code from the site. No codenames, no photo of the owner, never the owner's internet handle.
7. English only. No sound. Seed only real, verified data.
8. Ask the owner before: downloading files, installing system software, deleting/overwriting things you didn't create,
   changing account/project settings, production writes beyond the approved plan.
9. When asking questions, give a recommendation and a confidence level.

## Conventions
- Double quotes, semicolons, 2-space indent (match existing files). `@/` imports inside `src/`.
- Server-only modules import `"server-only"`; CLI scripts are `.mts` and use `scripts/_db.mts` (no `server-only`).
- Every admin page and Server Action calls `requireAdmin()`; `proxy.ts` is only an optimistic cookie check.
- MUI 9: no system props on Typography (`sx` instead), TextField uses `slotProps.htmlInput`, theme `variants` not `containedPrimary`.

## Commands
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run db:generate` / `db:migrate` ·
`npm run admin:seed` (`-- --reset` restores the seed password and forces a change)
