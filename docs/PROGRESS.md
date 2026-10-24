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
| P0 Start-up | ✅ done 2026-10-04 | Node 24.21, `gh` login, private repo `PastelSalt/moekoworks_official` (renamed 2026-10-20), Neon `moekoworks-official` (`shy-rice-98401386`, Singapore, PG 17), Cloudinary folders + signed presets, Vercel project `moesoft` |
| P1 Foundations | ✅ done | Next 16.3.8, React 19.2.8, MUI 9.4 (`@layer mui`), tokens/base CSS, Fredoka 400/700 + Lilita One, security headers (CSP report-only), brand SVGs |
| P2 Shell & design system | ✅ done (`dev`) | Sidebar / mobile bar + MENU sheet / footer / PAGE TOP; splash (real progress, FLIP); pattern stage from the logo glyphs, watercolor washes, giant words, vertical text, badge, stickers, tape, marquee; motion (Lenis, lean, sparkles, letter pops, CSS scroll-driven reveals, calm mode) |
| P3 Data & auth | ✅ done | Schema + `0000_init`; owner seeded (forced change pending — Kyle's first login); login / change password / sessions / lockout (9/9 e2e) |
| P4 Admin inputs | ✅ done (`dev`) | Project History editor (all §11.2 fields, signed uploads, publish, slug 301), Certifications, Tech catalog, Activity (10/10 e2e). **Uploads need `CLOUDINARY_API_KEY` + `_SECRET`** |
| P5 Public pages | ✅ done (`dev`) | Home, About, Contact, History, project template, Privacy, 404, error, sitemap, robots, manifest, OG image, JSON-LD |
| P6 Statistics | ✅ done (`dev`) | tracker → `/api/track` (cookieless, daily salt) → `/api/cron/daily` (rollups + purges, 00:30 PH) → `/admin/statistics` (kotoha KPIs + all §12 cards, CSV). Admin opt-out switch on Account |
| P7 Messages | ✅ done (`dev`) | inbox with folders, search, bulk actions, detail, reply via e-mail (9/9 e2e) |
| P8 Kotoha seed & media | ✅ done | 8 desktop + 2 phone shots, 29 s preview + 8 s hover loop, **7 admin shots (S4 done: temporary Neon branch `br-dawn-resonance-b3uw8bd6` created, anonymised, used, deleted; local copy + env removed)**; `seed:tech` (23) + `seed:kotoha` (19 media, admin shots on the For admins cards) |
| Design checkpoint ✋ | ✅ approved 2026-10-04 | Kyle: design OK, copy OK, Facebook link OK, Cloudinary key + secret added (Vercel production + `.env.local`); signed upload + delete verified |
| Hanon Fan Site ✅ | ✅ 2026-10-11 | Added from https://hanon-fansite.vercel.app (project id 5, **published**, now Latest): 8 desktop + 2 phone shots, 28 s preview + 8 s hover, 15 tech (new: PGlite), 23 operations. `scripts/capture/hanon.mts`, `encode-hanon.sh`, `seed-hanon.mts`. 6 admin shots on the "For admins" cards (local in-memory copy, see playbook §6.0) |
| Kotoha refresh | ✅ 2026-10-11 | Seed updated for the Kotoha repo's 2026-10-09 changes: Lenis + section glides gone (op "Scroll freely"), performance-pass op, sister-site op, birthday/debut dates, AiceClass as history; re-run with `--replace`. Card 04 "Never lose anything" now shows the admin Archive (local in-memory copy) |
| Moeko Works Portfolio | ✅ 2026-10-14 | This site added as a project (id 10, published, dated 2026-01-20 → No.01): 23 s preview, 13 stills, 17 tech, 11 visitor + 7 behind-the-scenes cards, no admin cards. `scripts/capture/moekoworks.mts`, `encode-moekoworks.sh`, `seed-moekoworks.mts` |
| Himawari ✅ | ✅ 2026-10-23 | Added from https://himawari-moekoworks.vercel.app + both repos (project id 11, **published**, now Latest, No.04): 27.5 s preview, 8 s hover, 7 desktop + 2 phone website shots, 4 real Studio shots from the engine repo's `docs/images` (`window` frame); 23 tech (14 new, 10 new logos), 20 ops (11 · 3 · 6), 4 links. **Owner's exception: open source, so the GitHub repo + releases are linked.** Seeded through the Neon MCP (`seed:himawari -- --sql`) because the local `.env.local` still has the pre-rotation password |
| Aqua Iro Archive ✅ | ✅ 2026-10-24 | Added from the local repo (`Documents/MoekoWorks/aqua-iro-archive`) + https://aqua-iro-archive.vercel.app (project id 12, **published**, now Latest, No.05, lifecycle beta: the full visual update planned 24 Oct is still in progress). 29.3 s preview with the page-switch shutters, 8 s hover, title + Home + 7 chapter shots + 2 phone; 21 tech (7 new: Better Auth, Umami, Discord webhooks, Cloudflare Turnstile, uPlot, Fuse.js, BudouX), 18 ops (10 · 3 · 5), 1 link (fan site: rule 6 applies, no repo link). Capture skips the splash/tour via the site's own storage keys (`aia:*`) and blocks Umami (`/s/ui.js`, `/s/api/pulse`); seeded through the Neon MCP (`seed:aqua -- --sql`) |
| Certifications + grades ✅ | ✅ 2026-10-23 | 7 NU certificates (participation/attendance, Oct 2024 – Jan 2026) + 6 NU term grade reports (AY 2024–2026) added, then 7 more the same day (Saylor CS302 + CS403 with hours/grade, Cisco NetAcad Computer Hardware Basics, Networking Basics, Networking Devices and Initial Configuration, Python Essentials 1, NU Science & Math lecture series): 22 published in total. Saylor certificates use their page 2 (hours, CEUs, grade). Grade sheets have the Student ID covered; titled `Grades: AY …, n Term · GWA x.xx` and dated by NU's usual term ends (Nov / Mar / Jul, owner-approved). About shows a "How to read my grades" note for them: NU's zero-based 4.00-is-highest scale (bands from NU's 2024 Dispensing syllabus via an unofficial NU GWA calculator) and why CCIT courses show Inc at midterm (owner's explanation). Files: `scripts/capture/out/certs/` (git-ignored), Cloudinary `moekoworks-official/certifications/*`. Inserted through the Neon MCP |
| Performance pass | ✅ 2026-10-14 (`dev`) | [`PERFORMANCE_PLAN.md`](PERFORMANCE_PLAN.md) §7: no visual change (pixel-checked). Scroll 30→54 fps (Home), 35→60 (About), 22→60 (Kotoha page); idle CPU About 93→9 %. Key fixes: no per-frame `--lean`, compositor marquee/flowers, MUI `box-sizing: inherit` override, Lenis loop only while scrolling. Harness `scripts/perf/{bench,trace,idle}.mjs` |
| P9 Quality | ⬜ | Lighthouse / a11y pass, CSP enforce, cross-browser checks |
| P10 Launch | 🟡 live 2026-10-04 | `dev` fast-forwarded into `main` (02323cd) → production on moekoworks.vercel.app. Still to do: Kyle's first login (sets his own password), Search Console + sitemap, OG debuggers |

## Incident log
### 2026-10-20 — EMERGENCY: brand renamed to **Moeko Works** (major)
**What happened.** Kyle found that the site's old name (the one this repo is still named after) is already used by an
established company that has nothing to do with him. Every public trace of it had to go immediately.

**Done in the repo (branch `claude/kind-mccarthy-89dx0w`, not yet merged into `main`):**
- Name, titles, metadata, JSON-LD, manifest, alt texts, footer/sidebar/menu copy, rotating badge, giant words, vertical
  text, privacy page → **Moeko Works**. `site.legalName` ("… Software and Technologies") removed; the old tagline
  "software and technologies" is now **"creative websites and systems"**.
- New logo + splash SVGs (`public/brand/moekoworks-logo.svg`, `moekoworks-splash.svg`): same flowers, colours, outline and
  shadow, wordmark "M✿eko Works" rebuilt from Lilita One (the Canva font), vector tagline in Fredoka (was a WebP).
  The wordmark is wider: viewBox 3000 × 653 (was 2084 × 653); every `<img>` width/height updated.
- Stage pattern (`pattern.svg`): f/t/some M letters swapped for k/r/W. OG image (`src/app/opengraph-image.jpg`)
  redrawn. `assets/` brand files regenerated as `moekoworks_logo.{png,pdf,gif}` (PDF is 1 page now, GIF 5 s splash).
- Storage keys `ms_*` → `mw_*` (old `ms_motion` / `ms_nt` are migrated once in the pre-paint script). Session cookie
  `__Host-mw_session`: **Kyle has to sign in again** after the deploy.
- Code defaults: site URL `https://moekoworks.vercel.app`, Cloudinary root `moekoworks-official`, presets
  `moekoworks_{images,videos}_signed`, package name, scripts (`seed-moekoworks.mts`, `capture/moekoworks.mts`,
  `encode-moekoworks.sh`, `npm run seed:moekoworks`), CSV export name, admin UA, password blocklist.
- `scripts/rebrand-moekoworks.mts`: rewrites the old name in every text column of the content tables and renames this
  site's project slug to `moekoworks-portfolio` (old slug kept in `project_slug_history` → 301). Dry run by default.

**Resolved 2026-10-20 (local session): live in production.** Merged `claude/kind-mccarthy-89dx0w` → `dev` → `main`
(fast-forward, `1cb0ce0`). Vercel project renamed `moesoft` → `moekoworks`; domain `moekoworks.vercel.app` added; the old
`*.vercel.app` domain **removed** (owner's choice: no redirect, it 404s). `NEXT_PUBLIC_SITE_URL` updated + redeployed.
Neon restore branch `before-rebrand-2026-10-20` (`br-late-band-b3owchpg`, no compute) taken, then
`rebrand-moekoworks.mts --apply` (11 writes; the old project slug 308s to `moekoworks-portfolio`). New random `HASH_PEPPER`.
Local fix: the hero badge and purple sticker no longer cover the wider logo at 900–1339 px. Verified live: every page
title, canonical, OG image, sitemap and robots carry the new name/domain; 0 old-name hits in page text.

**Cleanup pass 2026-10-20 (owner asked to "clean everything") — done:**
- E-mail switched to the personal Gmail address (`src/lib/site.ts`), live on /contact.
- Cloudinary presets `moekoworks_{images,videos}_signed` created (exact copies of the old ones, tag `moekoworks`).
- Media move: folder `moesoft-official` → `moekoworks-official` (and `projects/moesoft-portfolio` →
  `projects/moekoworks-portfolio`); all 53 assets renamed (versions unchanged); `media_assets.public_id` updated in one
  transaction (53 new, 0 old). Neon backup `before-media-move-2026-10-20` (`br-royal-term-b3t3gx3r`) taken first.
  Images were broken ~5 min between the rename and the production rebuild (commit `0e20df4` forced it). Verified after:
  0 old ids in page HTML, Hanon project page images load.
- Tag `moekoworks` added to all 47 images; `moekoworks-portfolio` added to that project's 13 images + 2 videos.

**Cleanup pass, part 2 (2026-10-20) — done:**
- Cloudinary: `moekoworks` tag on all 53 assets (+ the 2 certificate images), old `moesoft` / `moesoft-portfolio` tags removed;
  0 assets, tags or folders left with the old name. Old presets `moesoft_{images,videos}_signed` deleted. The old site `moesoft-web` no longer exists (Vercel has no such project; its address 404s).
- Live check: 358 media URLs across 6 pages, all 200.
- Neon: database renamed `moesoft` → `moekoworks`; `moesoft_owner` password reset by Kyle (the leaked one is dead).
  The role name stays: Neon roles can't grant/re-own each other (`permission denied to grant role`), so a rename would
  need a full data copy — owner chose to keep it (it only appears inside the private connection string).
- Vercel env: `DATABASE_URL` (new db + password), `CLOUDINARY_ROOT_FOLDER` = `moekoworks-official`,
  `CLOUDINARY_PRESET_{IMAGES,VIDEOS}` = `moekoworks_{images,videos}_signed` (they had overridden the code defaults
  with the old names since 2026-10-04), redeployed. Verified: production writes analytics events again.
- Docs: old infra names rewritten in `PRELIMENARYPLAN.md`, the playbook and here (only `moesoft_owner`
  and history lines keep the old name). Merged branch `claude/kind-mccarthy-89dx0w` deleted (local + origin).

**Closed 2026-10-20.** Kyle deleted the downloaded Neon `.env`, signed in to the admin again and re-ran the OG checks.
Both Neon backup branches (`before-rebrand-2026-10-20`, `before-media-move-2026-10-20`) deleted at his request.
Search Console: not set up, so no sitemap resubmission (the site still serves `/sitemap.xml`).
**Only open item:** Canva design `DAG9mW5bZm8` still shows the old wordmark (Kyle handles it himself, no rush).
**Password: done** (Kyle, 2026-10-23). The Neon `moesoft_owner` password was reset 2026-10-20 and is in Vercel. Local
`.env.local` deliberately still holds the old URL (old db name + password), so local scripts can't reach the DB:
use the Neon MCP (`run_sql_transaction`, e.g. `seed:<slug> -- --sql <file>`) or put the new URL in `.env.local`.

## Decisions taken during execution
- **Classic caching model** (Cache Components off): public pages pre-render with `revalidate = 600`; admin saves will call `revalidatePath`. Simpler with MUI/Emotion and cookie-based admin (plan §14.3 fallback).
- Kept the scaffold's React 19.2.8 / TypeScript 5 / ESLint 9 (more conservative than plan's "latest").
- Cover/preview/hover/OG are `media_assets.role` values instead of columns on `projects` (no circular FKs). Cover falls back to the first gallery image.
- Single DB role (`moesoft_owner`, name kept: Neon cannot rename/re-own it) instead of separate app/migrator roles.
- Logo tagline was rasterised in the Canva PDF (WebP in the SVGs); since the 2026-10-20 rebrand it is vector Fredoka paths.
- **Global CSS files in cascade layers** (`src/styles/*.css`, kotoha's approach) instead of CSS Modules; letter pops are server-split spans + CSS (no SplitText), reveals are CSS scroll-driven animations (kotoha). GSAP stays installed for later.
- `@next/next/no-img-element` is off: images are Cloudinary (`f_auto,q_auto`, srcset) or local SVG.
- Video URLs use the preset's eager transformations exactly (`c_limit,q_auto,vc_h264,w_1280/…mp4` etc.).
- Contact form: the signed start-time token is fetched when the visitor starts typing (pages are static); without JS the form still works but scores +2 spam.
- Seed media was uploaded before Kyle's review (nothing is public yet; easy to redo with `seed:kotoha -- --replace`).
- Statistics: no MUI X Charts (custom SVG/CSS bars, lighter); no `isbot` / `ua-parser-js` (small family-level classifier in `src/lib/ua.ts`). The tracker flushes 4 s after events as well as on hide/pagehide (headless Chrome drops unload beacons).
- Messages are plain text in the admin (no auto-linking) for safety.
- The scratchpad was wiped during a pause: the logo/pattern/wash generator scripts are gone (their outputs in `public/brand/` are final).

## Capture & seed commands
- Repo moved to `~/Desktop/Moesoft/moesoft_official` (2026-10-11). `.env.local` was recreated with the DB URLs only
  (Cloudinary key/secret and the admin seed values are not in it). Capture outputs were lost: rebuild
  `uploads.json` with `npx tsx scripts/capture/uploads-from-db.mts <slug> <folder>`.
- `npx tsx scripts/capture/hanon.mts [--shots|--video]` → `FFMPEG=<ffmpeg-static path> scripts/capture/encode-hanon.sh` → `npm run seed:hanon -- --replace`.
- `npx tsx scripts/capture/kotoha.mts [--shots|--video]` → `scripts/capture/out/kotoha/` (git-ignored), then `scripts/capture/encode.sh`.
- Upload: sign with the Cloudinary MCP `sign-upload`, POST with curl (deterministic public IDs, `overwrite`, eager for videos) → `uploads.json`.
- `npm run seed:tech`, `npm run seed:kotoha -- --dry-run | --replace`.
- Himawari (Windows): `npx tsx scripts/capture/himawari.mts [--shots|--video]` → copy the engine repo's `docs/images/*.png` to
  `out/himawari/app-*.png` → `FFMPEG=<ffmpeg-static ffmpeg.exe> bash scripts/capture/encode-himawari.sh` →
  upload → `npm run seed:himawari -- --sql <file>` → Neon MCP `run_sql_transaction` (or `seed:himawari` with a working `.env.local`).

## Owner to-dos
- **Rebrand follow-ups:** see "Incident log" → 2026-10-20, "Still open".
- First login on the live site (`/admin`) → set your own password (the seed password is temporary).
- Optional: add the Cloudinary key + secret to the **Preview** environment too if you want uploads on preview builds.
- Submit `https://moekoworks.vercel.app/sitemap.xml` in Google Search Console.
