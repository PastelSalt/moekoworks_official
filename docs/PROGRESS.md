# PROGRESS.md — status & resume protocol

> Plan: [`../PRELIMENARYPLAN.md`](../PRELIMENARYPLAN.md) v0.3 (approved 2026-10-04). This file tracks execution.

## Resume protocol (do this first, every new session)
1. Read this file, then `CLAUDE.md`. Don't re-ask decided questions (plan §0, §24, §26.1).
2. Check real state: `git status`, `git log --oneline -10`, and that files listed as done exist.
3. Continue from "Current focus". Update this file after every completed item; commit small and often.
4. New project to add? Use [`NEW-PROJECT-PLAYBOOK.md`](NEW-PROJECT-PLAYBOOK.md).

## Status
| Phase | Status | Notes |
|---|---|---|
| P0 Start-up | ✅ done 2026-10-04 | Node 24.21, `gh` login, private repo `PastelSalt/moesoft_official`, Neon `moesoft-official` (`shy-rice-98401386`, Singapore, PG 17), Cloudinary folders + signed presets, Vercel project `moesoft` |
| P1 Foundations | ✅ done | Next 16.3.8, React 19.2.8, MUI 9.4 (`@layer mui`), tokens/base CSS, Fredoka 400/700 + Lilita One, security headers (CSP report-only), brand SVGs |
| P2 Shell & design system | ✅ done (`dev`) | Sidebar / mobile bar + MENU sheet / footer / PAGE TOP; splash (real progress, FLIP); pattern stage from the logo glyphs, watercolor washes, giant words, vertical text, badge, stickers, tape, marquee; motion (Lenis, lean, sparkles, letter pops, CSS scroll-driven reveals, calm mode) |
| P3 Data & auth | ✅ done | Schema + `0000_init`; owner seeded (forced change pending — Kyle's first login); login / change password / sessions / lockout (9/9 e2e) |
| P4 Admin inputs | ✅ done (`dev`) | Project History editor (all §11.2 fields, signed uploads, publish, slug 301), Certifications, Tech catalog, Activity (10/10 e2e). **Uploads need `CLOUDINARY_API_KEY` + `_SECRET`** |
| P5 Public pages | ✅ done (`dev`) | Home, About, Contact, History, project template, Privacy, 404, error, sitemap, robots, manifest, OG image, JSON-LD |
| P6 Statistics | ✅ done (`dev`) | tracker → `/api/track` (cookieless, daily salt) → `/api/cron/daily` (rollups + purges, 00:30 PH) → `/admin/statistics` (kotoha KPIs + all §12 cards, CSV). Admin opt-out switch on Account |
| P7 Messages | ✅ done (`dev`) | inbox with folders, search, bulk actions, detail, reply via e-mail (9/9 e2e) |
| P8 Kotoha seed & media | ✅ done | 8 desktop + 2 phone shots, 29 s preview + 8 s hover loop, **7 admin shots (S4 done: temporary Neon branch `br-dawn-resonance-b3uw8bd6` created, anonymised, used, deleted; local copy + env removed)**; `seed:tech` (23) + `seed:kotoha` (19 media, admin shots on the For admins cards) |
| Design checkpoint ✋ | ✅ approved 2026-10-04 | Kyle: design OK, copy OK, Facebook link OK, Cloudinary key + secret added (Vercel production + `.env.local`); signed upload + delete verified |
| P9 Quality | ⬜ | Lighthouse / a11y pass, CSP enforce, cross-browser checks |
| P10 Launch | 🟡 live 2026-10-04 | `dev` fast-forwarded into `main` (02323cd) → production on moesoft.vercel.app. Still to do: Kyle's first login (sets his own password), Search Console + sitemap, OG debuggers; Kyle removes `moesoft-web` |

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
- Statistics: no MUI X Charts (custom SVG/CSS bars, lighter); no `isbot` / `ua-parser-js` (small family-level classifier in `src/lib/ua.ts`). The tracker flushes 4 s after events as well as on hide/pagehide (headless Chrome drops unload beacons).
- Messages are plain text in the admin (no auto-linking) for safety.
- The scratchpad was wiped during a pause: the logo/pattern/wash generator scripts are gone (their outputs in `public/brand/` are final).

## Capture & seed commands
- `npx tsx scripts/capture/kotoha.mts [--shots|--video]` → `scripts/capture/out/kotoha/` (git-ignored), then `scripts/capture/encode.sh`.
- Upload: sign with the Cloudinary MCP `sign-upload`, POST with curl (deterministic public IDs, `overwrite`, eager for videos) → `uploads.json`.
- `npm run seed:tech`, `npm run seed:kotoha -- --dry-run | --replace`.

## Owner to-dos
- First login on the live site (`/admin`) → set your own password (the seed password is temporary).
- Optional: add the Cloudinary key + secret to the **Preview** environment too if you want uploads on preview builds.
- Submit `https://moesoft.vercel.app/sitemap.xml` in Google Search Console; remove the old `moesoft-web` project when ready.
