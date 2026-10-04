# PROGRESS.md — status & resume protocol

> Plan: [`../PRELIMENARYPLAN.md`](../PRELIMENARYPLAN.md) v0.3 (approved 2026-10-04). This file tracks execution.

## Resume protocol (do this first, every new session)
1. Read this file, then `CLAUDE.md`. Don't re-ask decided questions (plan §0, §24, §26.1).
2. Check real state: `git status`, `git log --oneline -10`, and that files listed as done exist.
3. Continue from "Current focus". Update this file after every completed item; commit small and often.

## Status
| Phase | Status | Notes |
|---|---|---|
| P0 Start-up | ✅ done 2026-10-04 | Node 24.21, `gh` login, private repo `PastelSalt/moesoft_official`, Neon `moesoft-official` (`shy-rice-98401386`, Singapore, PG 17), Cloudinary folders `moesoft-official/{projects,certifications,site}` + presets `moesoft_images_signed` / `moesoft_videos_signed` |
| P1 Foundations | ✅ done | Next 16.3.8, React 19.2.8, MUI 9.4 (`@layer mui`), tokens/base CSS, Fredoka 400/700 + Lilita One, security headers (CSP report-only), brand SVGs from the logo PDF |
| P3 Data & auth | ✅ core done | Schema + migration `0000_init` applied; owner seeded (forced change); login / forced change / Account change password / sign out / sign out others / lockout — 9/9 e2e checks passed with a throwaway account (deleted) |
| P2 Shell & design system | ✅ done (branch `dev`) | Sidebar / mobile bar + MENU sheet / footer / PAGE TOP; splash (real progress, FLIP); pattern stage from the logo glyphs (`public/brand/pattern.svg`), watercolor washes, giant words, vertical text, badge, stickers, tape, marquee; motion (Lenis, lean, sparkles, letter pops, CSS scroll-driven reveals, calm mode) |
| P5 Public pages | ✅ first pass (branch `dev`) | Home, About, Contact (server action: honeypot, signed start time, 5/h rate limit, spam score), History (archive + floating hover preview), project template `/history/[slug]`, Privacy, 404, error, sitemap, robots, manifest. Missing: OG image file, JSON-LD Person/WebSite on Home |
| P8 Kotoha seed & media | 🟡 public part done | Live-site screenshots (8 desktop + 2 phone), 29 s preview + 8 s hover loop uploaded to `moesoft-official/projects/kotoha-fansite/*`; `npm run seed:tech` (23) + `npm run seed:kotoha` done (project id 1). **Pending: S4 admin screenshots** (temporary Neon branch of Kotoha DB + local Kotoha) |
| Design checkpoint ✋ | ⏳ waiting for Kyle | Preview of branch `dev` on Vercel (SSO-protected). Merge to `main` only with Kyle's OK |
| P4 Admin inputs | ⬜ next | Project History + Certifications CRUD, tech catalog. Needs `CLOUDINARY_API_SECRET` for signed uploads |
| P6 Statistics | ⬜ | tracker, `/api/track`, rollups, dashboard |
| P7 Messages | ⬜ | inbox for `contact_messages` |
| P9 Quality | ⬜ | |
| P10 Launch | ⬜ | Owner removes `moesoft-web` after launch |

## Decisions taken during execution
- **Classic caching model** (Cache Components off): public pages pre-render with `revalidate = 600`; admin saves will call `revalidatePath`. Simpler with MUI/Emotion and cookie-based admin (plan §14.3 fallback).
- Kept the scaffold's React 19.2.8 / TypeScript 5 / ESLint 9 (more conservative than plan's "latest").
- Cover/preview/hover/OG are `media_assets.role` values instead of columns on `projects` (no circular FKs). Cover falls back to the first gallery image.
- Single DB role (`moesoft_owner`) for now instead of separate app/migrator roles.
- Logo tagline is rasterised in the Canva PDF; brand SVGs embed it as a transparent WebP with a soft white halo.
- **Global CSS files in cascade layers** (`src/styles/*.css`, kotoha's approach) instead of CSS Modules; letter pops are server-split spans + CSS (no SplitText), reveals are CSS scroll-driven animations (kotoha). GSAP stays installed for later.
- `@next/next/no-img-element` is off: images are Cloudinary (`f_auto,q_auto`, srcset) or local SVG.
- Video URLs use the preset's eager transformations exactly (`c_limit,q_auto,vc_h264,w_1280/…mp4` etc.).
- Contact form: the signed start-time token is fetched when the visitor starts typing (pages are static); without JS the form still works but scores +2 spam.
- Seed media was uploaded before Kyle's review (nothing is public yet; easy to redo with `seed:kotoha -- --replace`).

## Capture & seed commands
- `npx tsx scripts/capture/kotoha.mts [--shots|--video]` → `scripts/capture/out/kotoha/` (git-ignored), then `scripts/capture/encode.sh`.
- Upload: sign with the Cloudinary MCP `sign-upload`, POST with curl (deterministic public IDs, `overwrite`, eager for videos) → `uploads.json`.
- `npm run seed:tech`, `npm run seed:kotoha -- --dry-run | --replace`.

## Owner to-dos
- Add **Cloudinary API key + secret** to `.env.local` and Vercel (needed for admin uploads; not for viewing).
- First login on the live site → set your own password (the seed password is temporary).
- Design checkpoint: review the `dev` preview.
