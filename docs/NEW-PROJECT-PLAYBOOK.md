# NEW-PROJECT-PLAYBOOK.md — adding a project to Moeko Works (guide for future Claude sessions)

> Written 2026-10-04 right after the Kotoha Fan Site was added and the site launched. It records the exact
> pipeline that worked end to end, with the scripts, IDs, settings and the mistakes worth not repeating.
> Read this together with `CLAUDE.md` (owner rules, conventions) and `docs/plans/PROGRESS.md` (current state).
> The plan behind all of it is `docs/plans/PRELIMENARYPLAN.md` (v0.3); §9 (project template), §11 (admin inputs),
> §16 (Cloudinary), §21 (the Kotoha seed) matter most here.

---

## 0. TL;DR — the whole pipeline

| # | Step | Output | Ask Kyle? |
|---|---|---|---|
| 1 | Intake: collect the project facts (§3) | filled record (title, one-sentence description, links…) | yes, for anything not verifiable |
| 2 | Research: read the project's repo / live site, verify every fact (§4) | verified stack, features, dates | only for gaps |
| 3 | Capture media from the live site: screenshots + screencast (§5) | `scripts/capture/out/<slug>/*` | no (already approved pattern) |
| 4 | Encode: preview edit with end card, 8 s hover loop, WebP stills (§5.4) | `<slug>-preview.mp4`, `<slug>-hover.mp4`, `*.webp` | no |
| 5 | (If the project has an admin) admin screenshots from a **local copy on a temporary Neon branch** (§6) | `out/<slug>/admin/*.webp` | **yes**: branch creation + deletion on their DB |
| 6 | Upload to Cloudinary with signed requests (§7) | `out/<slug>/uploads.json` | no (their own storage, approved) |
| 7 | Seed: add tech to `seed-tech.mts`, write `scripts/seed-<slug>.mts` from the Kotoha template, dry-run, run (§8) | project row + links + tech + operations + media | no before launch; **drafts only after launch** (see §1) |
| 8 | Verify locally: screenshots desktop + phone, lint, typecheck, build (§9) | screenshots in the scratchpad | no |
| 9 | Ship: secret scan → commit → push `dev` → preview → **checkpoint with Kyle** → fast-forward `main` → production checks (§10) | live project page | **yes** before `main` |

Alternative to steps 6–7 once Kyle wants to do it himself: the admin **Project History** editor
(`/admin/projects`) does the same through the UI, including signed uploads (§8.4).

---

## 1. Ground rules for this pipeline

These come from `CLAUDE.md` / the owner; the ones that bite during a project import are repeated here.

- **Never write the admin username or password anywhere tracked** (code, docs, commits, logs). The seed
  credentials live only in `.env.local` (`ADMIN_SEED_*`). Never complete the forced password change on the
  real owner account; tests use **throwaway admins** that are deleted afterwards (§11.6).
- **Never link a project's source code** (there is no `repo` link kind on purpose; the DB check constraint
  forbids it). No codenames, no photo of Kyle, never his internet handle in visible text.
- **One production database.** Before launch: test freely. **After launch (now): new projects are created
  as drafts** (`status: "draft"`) and published by Kyle, or published after his explicit OK at the checkpoint.
  Take a Neon restore point (branch) before any **schema** change.
- **Content is archived, never hard-deleted** (exceptions: Cloudinary files of deleted media, messages Kyle
  deletes, retention jobs, and the test rows *you* created).
- **Ask before:** creating/deleting Neon branches on *another* project's DB, installing system software,
  overwriting/deleting things you didn't create, changing account/project settings, merging to `main`.
  Installing a cloned project's own npm dependencies in the scratchpad for a local copy was accepted as
  part of the approved procedure.
- **Seed only real, verified data.** If a fact can't be verified from the repo/live site, ask Kyle.
- **Secrets:** never print them, never put them in commit messages; run the secret scan (§11.7) before every
  commit. Neon connection strings from `get_connection_string` contain the role password (shared by every
  branch of that project!) — keep them only in a scratch `.env.local` and delete it afterwards.
- **Don't pollute statistics:** block the target site's tracking endpoint during captures
  (Kotoha: `**/api/track**`), and set `localStorage.mw_nt = "1"` when screenshotting Moeko Works itself.
- When asking Kyle something: give a recommendation and a confidence level. Answer plainly if he's frustrated.
- English only. Copy tone: friendly portfolio voice (plan Appendix D), "Kyle" in first person on About only.
- Commit attribution: use the `Co-Authored-By` trailer the session's system reminder specifies. The repo-local
  git author is already configured (`Moeko Works: Moeko Works`).

---

## 2. Map of the system

### 2.1 Stack (as built)
- **Next.js 16.3.8** App Router + Turbopack, **classic caching**: public pages `export const revalidate = 600`,
  admin saves call `revalidatePath("/", "layout")`. Cache Components OFF. `src/proxy.ts` (not middleware).
  Typed routes: `PageProps<"/route">` / `LayoutProps<"/">`; run **`npx next typegen`** after adding a route
  or `tsc` fails with `does not satisfy the constraint 'AppRoutes'`.
- **React 19.2.8**, TypeScript 5, ESLint 9 (`react-hooks/purity` forbids `Date.now()` in render;
  `set-state-in-effect` forbids sync `setState` in effects).
- **MUI 9.4** (Emotion inside `@layer mui`) for admin + form primitives; the public look is plain global CSS
  in cascade layers (`reset, tokens, base, mui, components, sections, motion, utilities`).
- **Drizzle ORM 0.45** on **Neon** (`drizzle-orm/neon-http`): no interactive transactions → `db.batch([...])`.
- **Cloudinary** (cloud `dijqsw0k8`, dynamic folders, root `moekoworks-official`). Delivery helpers in
  `src/lib/cloudinary.ts`; never next/image (rule `@next/next/no-img-element` is off on purpose).
- Motion: Lenis (desktop + full motion), CSS scroll-driven reveals, server-split letter pops, cursor sparkles,
  canvas-confetti; calm mode via `html[data-motion]`. Splash via `html[data-splash = show|done|skip]`.
- Tooling: Node 24+ (26 on the current machine), `tsx` for scripts (scripts are **`.mts`** with explicit `.ts`
  imports), Playwright-core driving **`/usr/bin/google-chrome-stable`** (no browser download), `gh` logged in
  as PastelSalt. Since the 2026-10-11 move (now `Documents/MoekoWorks/moekoworks_official` on Windows) the machine has no system
  ffmpeg / ImageMagick: `ffmpeg-static` + `ffprobe-static` installed with npm in the scratchpad
  (`<scratch>/tools`, binary at `node_modules/ffmpeg-static/ffmpeg`, no `drawtext` filter) work, and stills /
  contact sheets use the repo's `sharp` (`createRequire(<repo>/package.json)("sharp")`).
  `scripts/capture/encode-hanon.sh` already works this way (`FFMPEG=<path> ./encode-hanon.sh`).

### 2.2 Accounts & IDs
| What | Value |
|---|---|
| GitHub repo | `PastelSalt/moekoworks_official` (private; renamed from `moesoft_official` 2026-10-20). Work on `dev`; `main` = production |
| Vercel project | `moekoworks` (renamed 2026-10-20) · `prj_iiroJzD4wL9Iw2ImeYHrxBZX05k3` · team `team_iTXgjBMqb9YpVCwrSPc0UKWO` (scope `pastelsalts-projects`) · Hobby · region `sin1` |
| Production URL | https://moekoworks.vercel.app |
| Preview of `dev` | `moekoworks-git-dev-pastelsalts-projects.vercel.app` (Vercel SSO: Kyle's login) |
| Old site | Removed (checked 2026-10-20: no such Vercel project, its address 404s) |
| Neon (Moeko Works) | project `shy-rice-98401386`, Singapore, PG 17, database `moekoworks` (role `moesoft_owner`: Neon cannot rename/re-own it, kept on purpose) |
| Neon (Kotoha) | project `odd-base-44136456`, default branch `main` (`br-tiny-credit-b3dga6s5`), database `kotoha`, role `kotoha_owner` |
| Cloudinary | cloud `dijqsw0k8`; folders `moekoworks-official/{projects/<slug>,certifications,site}`; presets `moekoworks_images_signed`, `moekoworks_videos_signed` (code defaults since the 2026-10-20 rebrand — until Kyle creates them, the old presets/folder are what the account has; see PROGRESS.md incident log) (signed, `disallow_public_id`, `unique_filename`, `overwrite: false`) |
| Video preset eager list | `c_limit,q_auto,vc_h264,w_1280/mp4` · `c_limit,q_auto,vc_vp9,w_1280/webm` · `c_limit,du_8,q_auto,vc_h264,w_854/mp4` · `c_limit,q_auto,so_auto,w_1280/jpg` |
| Kotoha | live https://kotoha-fansite.vercel.app/ · repo `PastelSalt/kotoha-fansite` (may be private; clone with `gh`) |
| Hanon | live https://hanon-fansite.vercel.app/ · repo `PastelSalt/hanon-fansite` · Neon `broad-flower-24329862` (branch `main` = `br-falling-water-az0enons`, db `hanon`) · tracking `/api/track` (same code base as Kotoha) |

### 2.3 Environment variables (names only — values live in `.env.local` and Vercel)
`NEXT_PUBLIC_SITE_URL`, `SITE_TIMEZONE` (Asia/Manila), `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED`
(scripts/migrations), `HASH_PEPPER`, `CRON_SECRET`, `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` (local CLI
only, never Vercel), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `CLOUDINARY_ROOT_FOLDER`, `CLOUDINARY_PRESET_IMAGES`, `CLOUDINARY_PRESET_VIDEOS`.
In Vercel the Cloudinary key + secret are set for **Production only** (preview builds have uploads off).
Check names without decrypting: Vercel MCP `filter_project_envs` (never pass `decrypt`).

### 2.4 Where things live
| Area | Files |
|---|---|
| Public pages | `src/app/(site)/{page,about,contact,history,history/[slug],privacy}`, `src/app/not-found.tsx` |
| Project template ("the boilerplate") | `src/app/(site)/history/[slug]/page.tsx` + `src/styles/project.css` |
| Cards / lists / media | `src/components/projects/*` (ProjectCard, LatestProject, PreviewVideo, HoverPreview, Lightbox, Tickets, bits) |
| Shell & motion | `src/components/site/*` (SiteShell, Sidebar, MobileBar, Splash(+Controller), MotionRoot, Tracker, PageHead, SectionHead…) |
| Decor | `src/components/decor/{Decor.tsx,Marquee.tsx,shapes.ts}`, `public/brand/*` |
| Public queries | `src/server/queries/public.ts` (React `cache()`d) |
| Admin | `src/app/admin/(panel)/*`, `src/components/admin/*`, actions in `src/server/admin/*` |
| Formatting / colour / markdown | `src/lib/{format,color,markdown,cloudinary,tech-icons,op-icons}.ts(x)` |
| Seeds & capture | `scripts/seed-tech.mts`, `scripts/seed-{kotoha,hanon}.mts`, `scripts/capture/{kotoha,hanon}.mts`, `encode.sh` / `encode-hanon.sh`, `uploads-from-db.mts`; outputs in `scripts/capture/out/` (git-ignored) |

### 2.5 How a project becomes pages
Tables: `projects` (1 row) → `project_links`, `project_technologies` (→ `technologies`), `project_operations`,
`media_assets` (`project_id`), `project_slug_history` (301s).

- **Latest** on Home = newest `published_at` among `status = 'published'`. Works grid / History list newest first.
- **Cover** = media with role `cover`, else the **first gallery image** (by `sort_order`).
- **Preview video** = role `preview` (hero + Latest card, in-view autoplay). **Hover clip** = role `hover`
  (cards + History floating preview); if missing, the first 8 s of the preview are used (`du_8`).
- **Gallery** = role `gallery` (masonry in device frames + lightbox). Role **`operation`** = an image only shown
  inside an operation card (`project_operations.media_id`). `og` = optional share image.
- **Frames:** `browser` (desktop shots), `phone` (portrait shots), `none`; `auto` picks phone for tall images.
- Sections number themselves and **disappear when empty**: Overview (description), What you can do (visitor
  ops), For admins (admin ops), Behind the scenes (system ops, dark cards), Built with (tech + usage notes,
  ribbon marquee), Gallery, Access (link tickets), Credits & disclaimer, prev/next.
- **Accent theming:** `accent_color` (+ optional `accent_color_2`) → `--project-accent*` vars via
  `accentVars()`; `accent_strong` / `accent_on` are computed (OKLCH darkening to ≥ 4.5:1) by the seed/editor.
- Enums (DB check constraints):
  - category: `web, mobile, desktop, game, tool, research, concept, other`
  - lifecycle (the project's own state): `live, beta, in_development, completed, delivered, research, concept, archived`
  - status (on Moeko Works): `draft, published, archived`
  - platforms (free text[], the UI offers): `web, android, ios, windows, macos, linux`
  - link kinds: `live, apk, exe, msi, dmg, appimage, ios, play_store, app_store, docs, demo_video, paper, other` (URLs must be `https://`)
  - media roles: `gallery, cover, preview, hover, operation, og, certificate, site` · frames: `auto, browser, phone, tablet, window, none`
  - operation audiences: `visitor, admin, system` · titles ≤ 80 chars · tagline 10–160 chars · title ≤ 80
- Operation icon keys (`src/lib/op-icons.ts`): archive, badge-check, chart, clapperboard, clock, cloud,
  cloud-upload, code, database, disc, gauge, globe, heart, images, key, languages, layers, dashboard, lock,
  megaphone, devices, click, news, palette, party, play, refresh, search, server, shield, shield-check,
  sparkles, timer, upload, user, users, wand, workflow, wrench, zap (unknown → Sparkles).
- Tech logo keys (`src/lib/tech-icons.ts`, Simple Icons slugs): android, androidstudio, chartdotjs, cloudflare,
  cloudinary, css, dart, docker, drizzle, electron, expo, ffmpeg, figma, firebase, flutter, git, github,
  godotengine, greensock, html5, javascript, jetpackcompose, kotlin, linux, lucide, mui, mysql, neon,
  nextdotjs, nodedotjs, php, postgresql, python, qt, react, sharp, sqlite, supabase, tailwindcss, tauri,
  typescript, unity, vercel, vite, youtube, zod. **To add one:** check it exists
  (`node -e "console.log(!!require('simple-icons').siSlug)"` — some brands were removed, e.g. Canva,
  Playwright, VS Code, C#), import it in `tech-icons.ts`, add to `ICONS`. Pale brand colours go in `READABLE`.
  No logo? leave `iconKey` null and set `color` (renders a monogram chip).

---

## 3. Step 1 — Intake

Ask Kyle only for what can't be verified. Use this record (it maps 1:1 to the seed / editor fields):

```text
Title (≤ 80):                       e.g. Kotoha Fan Site     (no codenames)
Slug:                               kebab-case, e.g. kotoha-fansite → /history/<slug>
One-sentence description (10–160):  shown on cards, the ribbon, search results
Full description (Markdown):        2–4 short paragraphs: what it is / the design idea / how it's built
Type (category):                    web | mobile | desktop | game | tool | research | concept | other
Platforms:                          web, android, ios, windows, macos, linux
Project status (lifecycle):         live | beta | in_development | completed | delivered | research | concept | archived
Role:                               e.g. "Solo developer: design, front end, back end, admin panel, analytics"
Timeline:                           started_on YYYY-MM-DD, finished_on (empty = ongoing → "Sep 2026 – present")
Accent colours:                     brand colour of the project (+ optional second) — from its CSS tokens
Links (never source code):          live site / APK / store / EXE / docs …, one primary
Tech stack:                         verified from package.json / imports; usage note per tech
Operations:                         visitor (what you can do) / admin (for admins) / system (behind the scenes)
Credits:                            role + name (+ https URL)
Disclaimer (Markdown):              required for fan works ("Unofficial, non-profit… belong to their owners")
Media:                              which pages/states to capture; is there an admin to screenshot (local copy)?
Publish now or draft?               after launch: draft unless Kyle says publish
```

## 4. Step 2 — Research & verify

1. Clone the project (scratchpad): `gh repo clone PastelSalt/<repo> <scratch>/<repo> -- --depth 1 -q`.
   Read `README`, `MIGRATION.md`/`PROGRESS.md`-style docs, `package.json`, the DB migrations, `api/`, the main
   HTML/JS. Write features as **operations** (visitor/admin/system) in Kyle's portfolio voice — concrete,
   one or two sentences each (see Kotoha's 20 in `scripts/seed-kotoha.mts`).
2. Look at the live site (built-in browser or Playwright): sections, ids, nav links, loader behaviour,
   language switch, lightbox, tracking endpoint. These become the capture storyboard (§5.3).
3. Pick the accent from the project's own tokens (Kotoha: `#FE9FB9` pink, `#63A23D` green).
4. Dates: from the repo history/docs (Kotoha: build authorised 26 Sep 2026 per its PROGRESS.md).
5. Delete the clone when done (`rm -rf`), and any `.env.local` you created inside it.

---

## 5. Step 3 — Capture media from the live site

### 5.1 Browser setup that works (headless Chrome on this machine)
- Chrome: `executablePath: "/usr/bin/google-chrome-stable"`, `headless: true`.
- **Use the real GPU** for anything animated (headless defaults to SwiftShader software rendering):
  `args: ["--hide-scrollbars", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization"]`
  → Intel HD 630 via ANGLE/OpenGL.
- Measured screencast frame rates on Kotoha (heavy page): 1280×720 GPU **~38 fps** · 1600×900 ~27 fps ·
  1920×1080 ~20 fps · 1280×720 software 20 fps · 1920×1080 software ~10 fps.
  → **Record video at 1280×720** (the site never delivers more than 1280 px wide anyway); take
  **screenshots at 1920×1080** (stills don't need fps).
- `ctx.route("**/api/track**", r => r.abort())` (or the target's analytics endpoint) — **always**.
- **On the current laptop (Vega 3) the forced GPU flags break hardware video decoding** (every `<video>` fails with
  `MEDIA_ERR_DECODE`, the frame stays white): add `--disable-accelerated-video-decode` (GPU rendering stays on).
  Not a site bug: normal Chrome plays the videos.
- Phone shots: `{ viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: <Android Chrome UA> }` so `(pointer: coarse)` matches (Lenis/hover effects switch off).

### 5.2 Screenshots
Copy `scripts/capture/kotoha.mts` → `scripts/capture/<slug>.mts`, change `SITE`, `OUT`, and the selectors.
Kotoha's shot list (8 desktop + 2 phone): loader, home after the intro, about, news, discography, gallery
masonry, lightbox open, Japanese view; phone home + phone gallery. Save PNG, convert to WebP later.
Run: `npx tsx scripts/capture/<slug>.mts --shots`, then check a contact sheet:
```bash
cd scripts/capture/out/<slug> && magick montage d0*.png -tile 4x2 -geometry 480x270+6+6 -background '#ddd' <scratch>/sheet.png
```
Kotoha specifics that generalise: wait for the loader to be **removed from the DOM**
(`waitForFunction(() => !document.querySelector("#loader"))`) + ~2.6 s for the intro; navigate with the
site's **own nav links** (`a[href="#section"]`.click()) and wait ~2.7–3.2 s for glides; tiles were
`#masonry button.tile`; the language toggle is rendered by JS — click
`[data-lang-switch] button[lang="ja"]` filtered with `.locator("visible=true")`.

### 5.3 Video (CDP screencast → ffconcat)
How `kotoha.mts --video` works (keep this design):
- `const cdp = await ctx.newCDPSession(page)`, `Page.startScreencast({ format: "jpeg", quality: 88,
  maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 })`.
- On each `Page.screencastFrame`: **ack first** (`Page.screencastFrameAck`), then write the JPEG
  asynchronously, record `metadata.timestamp`.
- Mark storyboard times (`mark("about")` …) → `marks.json`; write `frames.ffconcat` with real per-frame
  durations (variable frame rate), encoded to constant 30 fps later.
- **Storyboard via nav links, not the mouse wheel**: on Kotoha the wheel got stuck inside the long News
  section for 8 s. Kotoha final order: load → loader → iris → home (hold 1.8 s) → about → news →
  discography → gallery → open first tile (2.3 s) → Esc → home → switch to Japanese (2.6 s).
- Result: 1114 frames / 32 s (~36 fps).

### 5.4 Encode (scripts/capture/encode.sh — adapt the times)
1. Raw 30 fps: `ffmpeg -f concat -safe 0 -i frames.ffconcat -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 16 raw-30fps.mp4`
2. **Look before you cut** — timeline sheet (one frame every 1.5 s with timestamps):
   ```bash
   ffmpeg -i raw-30fps.mp4 -vf "fps=0.66,scale=320:-2,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6" -frames:v 24 t_%02d.png
   magick montage t_*.png -tile 6x4 -geometry +4+4 -background '#ccc' timeline.png && rm t_*.png
   ```
   Find the first non-blank frame (`magick probe.png -colorspace gray -format "%[fx:mean]" info:` = 1 → white).
3. Edit = trimmed segments + `xfade` + **end card** (§11.3), H.264 CRF 21, `+faststart`, no audio. Kotoha:
   `[1.2–24.6] ⨯fade 0.4⨯ [27.6–32.0] ⨯fade 0.5⨯ end card 2.2 s` → 29.1 s, 1280×720, 7.0 MB.
   xfade offsets: `offset1 = len(a) − d1`, `offset2 = len(a)+len(b) − d1 − d2`.
4. Hover loop: 8 s of the liveliest part (home → first glide), `scale=854:-2`, CRF 25 → ~0.7 MB.
5. Stills → WebP: `magick f.png -quality 90 -define webp:method=6 f.webp` (100–400 KB each).
6. Deliverable sizes target: preview ≤ ~8 MB, hover ≤ 1 MB, stills ≤ 400 KB.

### 5.5 Mobile / desktop apps (not done yet — suggested approach, verify before relying on it)
- Android: emulator or device via `adb exec-out screencap -p > shot.png`, video `adb shell screenrecord
  --size 720x1600 /sdcard/v.mp4` (≤ 3 min), pull with `adb pull`; frame `phone`. Link kinds `apk` /
  `play_store`; the ticket shows "External download" + `note` (version · size).
- Desktop apps: capture the window with ffmpeg (`-f x11grab` / Wayland portal) or app screenshots Kyle
  provides; frame `window`/`browser`; link kinds `exe`/`msi`/`dmg`/`appimage`.
- Ask Kyle before installing any SDK/emulator (owner rule 8).

---

## 6. Step 4 — Admin screenshots

### 6.0 Preferred (since 2026-10-11): local copy on an in-memory database
No branch, no real database, nothing to tear down on Neon. Works for any site on the Kotoha/Hanon code base:
```bash
node scripts/capture/admin-local.mjs <site repo> https://<site>.vercel.app 3100 <scratch>/login.json   # background
node scripts/capture/admin-shots.mjs <scratch>/login.json scripts/capture/out/<slug>/admin 3100
```
`admin-local.mjs` loads the site's migrations + seed into PGlite, copies its published gallery from the public
API, creates a local test owner `owner` and starts the site's own `scripts/dev-server.js`. `admin-shots.mjs`
signs in, archives the oldest news item and video in that copy (so the Archive page isn't empty) and captures
dashboard, statistics, videos, gallery, archive, activity, accounts and account. Limitation: no visitor data,
so the dashboard/statistics shots are empty; leave them out. Hanon's repo already has the `lib/db.js` hook;
Kotoha needs a scratch clone with the one-line hook (see the header of `admin-local.mjs`). Delete the login
file afterwards.

### 6.1 Older procedure: temporary Neon branch ("S4")

Used for Kotoha's 7 admin shots. **Ask Kyle first** (it creates/deletes a branch on that project's DB).
Never touch the production branch; never show real usernames.

1. **Inspect** the project's schema: admin users table, any table storing usernames as text
   (Kotoha: `admin_users.username`, `activity_log.admin_username`, `archived_content.archived_by_username`,
   `login_attempts.username_attempted`), and its password hashing (Kotoha: `@node-rs/argon2`,
   `{ memoryCost: 19456, timeCost: 2, parallelism: 1 }` — same as Moeko Works).
2. **Create the branch** (Neon MCP `create_branch`, name e.g. `moekoworks-screenshots-tmp`). Don't pass
   `compute.suspend_timeout_seconds` — the plan rejects it (HTTP 412).
3. **Throwaway login**: generate a random password + hash locally, store both in `<scratch>/…json`
   (mode 600, deleted at the end); never print the password:
   ```bash
   node -e "const {hash}=require('@node-rs/argon2');const c=require('node:crypto'),fs=require('node:fs');const pw='shots-'+c.randomBytes(12).toString('base64url');hash(pw,{memoryCost:19456,timeCost:2,parallelism:1}).then(h=>{fs.writeFileSync('<scratch>/test-login.json',JSON.stringify({username:'owner',password:pw}),{mode:0o600});fs.writeFileSync('<scratch>/test-hash.txt',h,{mode:0o600});console.log('ok')})"
   ```
4. **Anonymise on the branch only** (`run_sql` with `branch_id`; one statement per call):
   ```sql
   update admin_users set username = 'owner', password_hash = '<hash>', must_change_password = false,
     temp_password_expires_at = null, locked_until = null, failed_login_count = 0 where id = <owner id>;
   update activity_log set admin_username = 'owner';
   update login_attempts set username_attempted = 'owner';
   -- (+ archived_content.archived_by_username if it has rows; other admins → 'admin-<n>')
   ```
5. `get_connection_string` for the branch → write `<scratch>/<repo>/.env.local` (umask 077) with the vars
   the project needs (Kotoha: `DATABASE_URL`, `ANALYTICS_SALT=<random>`, `ALLOWED_ORIGINS=localhost:3100`,
   `PORT=3100`). Uploads stay off (no Cloudinary secret).
6. `npm ci --omit=dev` in the clone, then run its own dev server **in the background on 3100**
   (Moeko Works dev uses 3000): `node --env-file=.env.local scripts/dev-server.js`.
7. Capture with §11.4 (sign in, hash-route through the admin pages, 1920×1080, `reducedMotion: "reduce"`),
   and assert no real username appears in `document.body.innerText`.
8. **Tear down immediately:** stop the server (TaskStop), `delete_branch` (needs Kyle's OK — get it in step 1),
   `rm -rf` the clone (incl. `.env.local`) and the test login/hash files.
9. Convert to WebP, drop duplicates (Kotoha's two statistics shots were identical).

---

## 7. Step 5 — Upload to Cloudinary (signed, deterministic public IDs)

Seed uploads do **not** use the presets (they forbid choosing a `public_id`); sign the parameters yourself with
the Cloudinary MCP **`sign-upload`** tool, then POST with curl.

1. Sign one entry per file (all at once):
   ```json
   { "public_id": "moekoworks-official/projects/<slug>/<name>", "asset_folder": "moekoworks-official/projects/<slug>",
     "tags": "moekoworks,<slug>", "overwrite": true, "invalidate": true,
     "colors": true }                                  // images
   { …same…, "eager": "c_limit,q_auto,vc_h264,w_1280/mp4|c_limit,q_auto,vc_vp9,w_1280/webm|c_limit,du_8,q_auto,vc_h264,w_854/mp4|c_limit,q_auto,so_auto,w_1280/jpg",
     "eager_async": true }                             // the preview video
   { …same…, "eager": "c_limit,q_auto,vc_h264,w_854/mp4", "eager_async": true }   // the hover clip
   ```
   The tool **adds `upload_preset` and `audit_context`** to `upload_params` — echo **every** key of
   `upload_params` as a form field, exactly as returned, or the signature fails. Signatures expire (~1 h).
2. Save the tool's JSON response to `<scratch>/signed.json` and run §11.5 → it uploads each file and writes
   `scripts/capture/out/<slug>/uploads.json` (public_id, version, format, width, height, bytes, duration,
   dominant colour). Kotoha naming: `preview`, `hover`, `home`, `about`, …, `phone-home`, `admin-dashboard` …
3. **Why these exact eager strings:** the site's delivery URLs (`cldVideo.*` in `src/lib/cloudinary.ts`)
   use the identical transformations with the format as the file extension, so pages hit pre-generated
   derivatives. If you change one, change both.

---

## 8. Step 6 — Seed

### 8.1 Tech catalog
Add missing technologies to `TECH` in `scripts/seed-tech.mts` (`slug, name, category, iconKey?, color?, url`),
categories: `language, framework, library, runtime, database, cloud, service, tool, design, platform, other`.
`npm run seed:tech` (idempotent upsert by slug; `-- --dry-run` to preview).

### 8.2 Project seed from the template
`cp scripts/seed-kotoha.mts scripts/seed-<slug>.mts`, add `"seed:<slug>": "tsx scripts/seed-<slug>.mts"` to
`package.json`, then edit:
- `SLUG`, `ACCENT`, `ACCENT_2`, the `project` object (title, tagline, descriptionMd, category, platforms,
  lifecycle, role, startedOn/finishedOn, credits, disclaimerMd). **After launch set `status: "draft"`** unless
  Kyle approved publishing; `publishedAt` is then set when he publishes in the admin.
- `links` (one `isPrimary: true`), `stack` (`[techSlug, usageNote]`, order = display order).
- `operations` (`[audience, title, body, icon]`), `media` (`[uploadKey, role, frame, altText, caption]`,
  order = `sort_order`; the first `gallery` image is the cover), `opMedia` (operation title → upload key;
  those media use role `operation`).
- The uploads path (`capture/out/<slug>/uploads.json`).
Built-in guards: tagline ≤ 160, op titles ≤ 80, unknown tech, missing uploads. The script refuses to touch an
existing project unless `--replace` (which rewrites its links/tech/operations/media, keeps `published_at`).
```bash
npm run seed:<slug> -- --dry-run    # prints everything it would write
npm run seed:<slug>                 # create
npm run seed:<slug> -- --replace    # re-run after changes (pre-publish)
```
Media are inserted first (returning ids), then operations reference their screenshot ids.

**Lost `uploads.json`?** (`scripts/capture/out/` is git-ignored, so a new machine or a moved repo loses it.)
Rebuild it from the project's media rows before a `--replace`:
`npx tsx scripts/capture/uploads-from-db.mts <project slug> <out folder>` (e.g. `kotoha-fansite kotoha`).

### 8.3 Alt text & captions (required before publishing)
Every image needs alt text (publish is blocked otherwise). Write what's on screen ("Admin panel: the fan-art
gallery with a drop zone for uploads and credit editing."); captions are short and optional.

### 8.4 The admin path (Kyle or you via the UI)
`/admin/projects` → *New project* (title) → editor: basics, **video & images** (Uploader: signed direct
upload with progress; limits 10 MB image / 100 MB video), links, tech (autocomplete from the catalog + usage
notes), description (Markdown + preview), operations, credits/disclaimer/SEO → **Save** → **Save & publish**
(confetti; becomes Latest). Renaming the slug of a published project writes `project_slug_history` → 301.
Deleting a media item deletes the row **and** the Cloudinary file.

---

## 9. Step 7 — Verify locally

1. Dev server: built-in browser `preview_start` with name `moekoworks-dev` (`.claude/launch.json`, port 3000).
   First compile of a route can take **~30 s** in dev — use 60–90 s timeouts in tests.
2. Screenshots with §11.1 (skips the splash, doesn't count the visit). Check: Home (ticker, Latest card,
   Works grid), `/history` (row + LATEST sticker + floating preview), `/history/<slug>` hero and every section
   (`--scroll=#ops-admin` etc.), the phone layout (`390 844 --mobile`).
   Don't trust **full-page** screenshots for scroll-revealed content (CSS scroll-driven animations only run in
   the real viewport) — scroll to positions instead.
3. `npx next typegen && npx tsc --noEmit && npx eslint src scripts && npm run build` (the build pre-renders
   the new page via `generateStaticParams`; check it appears as `● /history/<slug>`).
4. Optional e2e with a throwaway admin (§11.6) if you changed admin code.

## 10. Step 8 — Ship

1. Secret scan (§11.7) → commit on `dev` (small, descriptive, trailer) → `git push origin dev`.
2. Vercel builds a preview of `dev` (check `list_deployments` for `READY`; the Vercel MCP **can't** open
   SSO-protected previews or read build logs — 403 on team scope — Kyle opens the preview himself).
3. **Checkpoint with Kyle** (screens, copy, media). Changes → iterate.
4. With his OK: `git checkout main && git merge --ff-only dev && git push origin main && git checkout dev`
   (never force-push). Production builds in ~1 min.
5. Wait for it (background until-loop: `curl -s https://moekoworks.vercel.app/ | grep -q "<new title>"`), then
   run §11.8 and a live screenshot. Seed data is in the DB already, so the new build's ISR pages include it;
   otherwise pages refresh within 10 minutes.
6. Update `docs/plans/PROGRESS.md` (docs-only commits can stay on `dev` until the next approved merge).

---

## 11. Reusable scripts (the scratchpad gets wiped between sessions — recreate from here)

`<scratch>` = the session scratchpad directory from the system prompt.

### 11.1 Screenshot helper (`<scratch>/shot.mjs`)
```js
// node shot.mjs <path> <name> [w=1440] [h=900] [--scroll=<css selector|px>] [--mobile] [--full] [--live]
import { createRequire } from "node:module";
const { chromium } = createRequire("C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/package.json")("playwright-core");
const [, , path = "/", name = "shot", w = "1440", h = "900", ...flags] = process.argv;
const has = (f) => flags.includes(f);
const base = has("--live") ? "https://moekoworks.vercel.app" : "http://localhost:3000";
const scroll = flags.find((f) => f.startsWith("--scroll="))?.slice(9);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true });
const ctx = await b.newContext({
  viewport: { width: +w, height: +h }, isMobile: has("--mobile"), hasTouch: has("--mobile"), deviceScaleFactor: has("--mobile") ? 2 : 1,
  userAgent: has("--mobile") ? "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36" : undefined,
});
// skip the splash, and never count these visits in Moeko Works' statistics
await ctx.addInitScript(() => { try { sessionStorage.setItem("mw_splash", "1"); localStorage.setItem("mw_nt", "1"); } catch {} });
const page = await ctx.newPage();
await page.goto(base + path, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);
if (scroll) {
  await page.evaluate(async (t) => {
    const y = /^\d+$/.test(t) ? +t : (document.querySelector(t)?.getBoundingClientRect().top ?? 0) + scrollY - 60;
    for (let s = 0; s <= y; s += 400) { scrollTo(0, s); await new Promise((r) => setTimeout(r, 50)); }
    scrollTo(0, y);
  }, scroll);
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: `${process.env.SCRATCH ?? "."}/${name}.png`, fullPage: has("--full") });
await b.close();
```

### 11.2 Frame-rate probe (decide the capture size)
```js
// node fps.mjs <w> <h> gpu|cpu  → prints frames per second of a 9 s screencast of the target site
import { createRequire } from "node:module";
const { chromium } = createRequire("C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/package.json")("playwright-core");
const [, , w, h, mode] = process.argv;
const args = mode === "gpu" ? ["--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization"] : [];
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args });
const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
await ctx.route("**/api/track**", (r) => r.abort());
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
let n = 0, t0 = 0, t1 = 0;
cdp.on("Page.screencastFrame", ({ metadata, sessionId }) => { cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {}); t0 ||= metadata.timestamp; t1 = metadata.timestamp; n++; });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: +w, maxHeight: +h, everyNthFrame: 1 });
await page.goto("https://<target-site>/", { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 9000));
console.log(`${w}x${h} ${mode}: ${(n / (t1 - t0)).toFixed(1)} fps`); await b.close();
```

### 11.3 End card (1280×720, rendered with Playwright, used as the last 2.2 s of the preview)
Write `<scratch>/endcard.html`, screenshot at 1280×720 into `scripts/capture/out/<slug>/endcard.png`
(`--allow-file-access-from-files`, wait for `document.fonts.ready`). Kotoha's version:
```html
<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&display=block" rel="stylesheet">
<style>
html,body{margin:0;width:1280px;height:720px;overflow:hidden;font-family:Fredoka,sans-serif}
.card{position:relative;width:1280px;height:720px;display:grid;place-items:center;
  background:linear-gradient(150deg,<accent tint>,#fffdfe 48%,<accent-2 tint>)}
.card::before{content:"";position:absolute;inset:0;background:url(C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/public/brand/pattern.svg) 0 0/720px;opacity:.9}
.inner{position:relative;display:grid;justify-items:center;gap:14px;padding:44px 64px 40px;border-radius:32px;
  background:rgba(255,255,255,.86);border:2px solid #1e1a24;box-shadow:0 22px 50px -26px rgba(143,31,85,.45)}
.label{font-size:15px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#5d5869}
h1{margin:0;font-size:64px;line-height:1;color:#2e2a36}
.url{padding:10px 22px;border-radius:999px;background:<accent>;border:2px solid #1e1a24;font-size:24px;font-weight:700;box-shadow:4px 5px 0 #e2a8f2}
.by{display:flex;align-items:center;gap:12px;font-size:16px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#5d5869}
.by img{width:190px}
</style></head><body><div class="card"><div class="inner">
<div class="label">Project · No.0N ✿</div><h1><Project title></h1><div class="url"><host></div>
<div class="by">by <img src="C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/public/brand/moekoworks-logo.svg" alt=""></div>
</div></div></body></html>
```

### 11.4 Admin capture template (local copy on port 3100)
```js
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire("C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/package.json")("playwright-core");
const login = JSON.parse(readFileSync("<scratch>/test-login.json", "utf8"));
const OUT = "C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/scripts/capture/out/<slug>/admin/";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl"] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, locale: "en-US", reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto("http://localhost:3100/login", { waitUntil: "networkidle" });       // Kotoha: #username / #password
await page.fill("#username", login.username); await page.fill("#password", login.password); await page.keyboard.press("Enter");
await page.waitForURL(/\/admin/, { timeout: 60000 }); await page.waitForLoadState("networkidle"); await page.waitForTimeout(2500);
const shot = async (name, hash, scroll = 0) => {
  if (hash) { await page.evaluate((h) => (location.hash = h), hash); await page.waitForLoadState("networkidle"); await page.waitForTimeout(2500); }
  if (scroll) { await page.evaluate((y) => scrollTo(0, y), scroll); await page.waitForTimeout(1200); }
  await page.screenshot({ path: OUT + name + ".png" });
};
await shot("dashboard", "#/dashboard"); await shot("statistics", null, 900);
await shot("videos", "#/videos"); await shot("gallery", "#/gallery"); await shot("activity", "#/activity");
await shot("accounts", "#/accounts"); await shot("account", "#/account");
console.log("real name visible:", /moeko/i.test(await page.evaluate(() => document.body.innerText)));   // must be false
await b.close();
```

### 11.5 Signed upload runner (`<scratch>/upload.py`)
```python
# python3 upload.py <signed.json from the sign-upload tool> <slug> name=file [name=file …]
# (order of name=file pairs must match the order of entries you signed)
import json, subprocess, sys
signed, slug, pairs = json.load(open(sys.argv[1])), sys.argv[2], [a.split("=", 1) for a in sys.argv[3:]]
OUT = f"C:/Users/Myaako/Documents/MoekoWorks/moekoworks_official/scripts/capture/out/{slug}"
try: results = json.load(open(f"{OUT}/uploads.json"))
except FileNotFoundError: results = {}
for entry, (name, path) in zip(signed, pairs):
    kind = "video" if path.endswith((".mp4", ".webm", ".mov")) else "image"
    url = f"https://{entry['host']}/v1_1/{entry['cloud_name']}/{kind}/upload"
    cmd = ["curl", "-sS", "--max-time", "300", url, "-F", f'file=@"{OUT}/{path}"',
           "-F", f"api_key={entry['api_key']}", "-F", f"signature={entry['signature']}"]
    for k, v in entry["upload_params"].items():          # echo EVERY signed param, exactly
        v = "true" if v is True else "false" if v is False else str(v)
        cmd += ["-F", f"{k}={v}"]
    j = json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)
    if "error" in j: print(name, "ERROR", j["error"]); continue
    keep = {k: j.get(k) for k in ("public_id", "version", "format", "width", "height", "bytes", "duration", "resource_type", "secure_url", "asset_id")}
    keep["dominant"] = (j.get("colors") or [[None]])[0][0]
    results[name] = keep
    print(f"{name:16} {keep['resource_type']} {keep['width']}x{keep['height']} {keep['bytes']}B")
json.dump(results, open(f"{OUT}/uploads.json", "w"), indent=2)
```
Booleans: the tool returns `overwrite: true` but `invalidate: 1`/`colors: 1` — send them as returned
(`true` / `1`), which is what the runner does.

### 11.6 Throwaway-admin e2e pattern (copy into `scripts/.<name>.tmp.mts`, run with `npx tsx`, then delete)
```ts
import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { chromium } from "playwright-core";
import { db, schema } from "./_db.mts";
const U = "e2etest";                                       // never the real owner account
const pw = "orchid " + randomBytes(6).toString("hex") + " meadow";
const [user] = await db.insert(schema.adminUsers).values({ username: U, passwordHash: await hash(pw), mustChangePassword: false }).returning();
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(90000);                           // first dev compile can take ~30 s
  await page.goto("http://localhost:3000/admin/login");
  await page.fill("input[name=username]", U); await page.fill("input[name=password]", pw);
  await page.click("button[type=submit]"); await page.waitForURL(/\/admin$/);
  // … exercise the feature, assert DB rows …
} finally {
  await browser.close();
  // delete ONLY what this test created
  await db.delete(schema.activityLog).where(eq(schema.activityLog.adminUserId, user.id));
  await db.delete(schema.loginAttempts).where(inArray(schema.loginAttempts.usernameAttempted, [U]));
  await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, user.id));   // sessions cascade
}
```
Visitor-side tests: set a normal desktop UA (the tracker drops "headless" UAs as bots); dev events are stored
with `environment = 'development'` — delete them afterwards (`delete … where environment = 'development'`).
Headless Chrome **drops beacons sent while a page unloads**: wait > 4 s (the tracker's timed flush) before
navigating away in tests. Block external `target=_blank` links with an init script so tests never visit
other sites.

### 11.7 Secret scan (run before every commit)
```bash
python3 - <<'EOF'
import subprocess, re
env = dict(l.strip().split("=", 1) for l in open(".env.local") if "=" in l and not l.startswith("#"))
added = "\n".join(l for l in subprocess.run(["git", "diff", "--cached", "-U0"], capture_output=True, text=True).stdout.splitlines() if l.startswith("+"))
public = {"NEXT_PUBLIC_SITE_URL", "SITE_TIMEZONE", "CLOUDINARY_ROOT_FOLDER", "CLOUDINARY_PRESET_IMAGES", "CLOUDINARY_PRESET_VIDEOS", "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD_NAME"}
hits = [k for k, v in env.items() if len(v.strip('"')) >= 8 and k not in public and v.strip('"') in added]
# the [c] / [Y] brackets keep these patterns from matching this playbook's own text
hits += [p for p in (r"postgres(ql)?://", r"npg_[A-Za-z0-9]{8,}", r"neon\.tech", r"api_se[c]ret", r"PRIVATE KE[Y]") if re.search(p, added)]
print("secret scan:", "CLEAN" if not hits else hits)
EOF
```

### 11.8 Production smoke check
```bash
B=https://moekoworks.vercel.app; UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
for p in / /history /history/<slug> /about /contact /privacy /sitemap.xml /robots.txt /opengraph-image.jpg /nope; do
  printf "%-28s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{size_download}B' -A "$UA" "$B$p")"; done
curl -s -o /dev/null -w "/admin → %{http_code} %{redirect_url}\n" "$B/admin"            # 307 → /admin/login
curl -sI "$B/admin/login" | grep -i x-robots-tag                                        # noindex, nofollow
curl -s "$B/sitemap.xml" | grep -c "<slug>"                                             # ≥ 1 once published
# endpoints without recording anything: nt=1 → 204, bad body → 400, cron without secret → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST -A "$UA" --data '{"v":"livecheck-0000","d":"desktop","nt":1,"e":[{"t":"page_view","p":"/"}]}' "$B/api/track"
curl -s -o /dev/null -w "%{http_code}\n" -X POST --data 'nope' "$B/api/track"
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/cron/daily"
```

### 11.9 Site share image (only if the brand changes)
`src/app/opengraph-image.jpg` (1200×630) + `opengraph-image.alt.txt` were rendered like the end card from an
HTML page (pattern stage, washes, logo, "A portfolio by Kyle Zoleta", badge, vertical text), PNG → JPEG
quality 88 (~130 KB). Project pages use their cover via Cloudinary (`c_fill,g_auto,w_1200,h_630`, `f_jpg`).

---

## 12. Design system cheat-sheet (for new sections, pages or tweaks)

Look: **"Bloom Expo"** = Miku Expo structure + Happy Sugar Life palette/ornaments + Kotoha density. Kyle's
wireframes are content intent only — never use them for colour/format. Guardrails: text always on paper/white,
≤ 3 moving decorations per viewport, decorations `aria-hidden`, density from information not noise.

- Tokens (`src/theme/tokens.css`): pink 50–800 (`--pink-300` #FFB4E3 fills, `--pink-700` #B42A6C text/links),
  blue 50–800 (`--blue-300` #A0CFFC, `--blue-700` #1665AE), lilac/violet/butter/peach, ink `#2E2A36`,
  canvas `#F6F7FB`; radii chip 12 / input 16 / card 24 / panel 32; `--shadow-paper`, `--shadow-lift`,
  `--shadow-sticker: 4px 5px 0 var(--lilac-300)`; `--beat: 500ms` (120 BPM), eases `--ease-pop/out`.
  Pastel fills always carry **ink** text (MUI outlined/text pastel buttons use strong shades — theme variants).
- Fonts: Fredoka 400/700 everything; **Lilita One** only for giant outlined words / pattern (`--font-logo`).
- Components (global classes, `src/styles/components.css`): `.paper(.paper--pad/--dots/--lilac)`,
  `.sticker(--blue/--lilac/--butter/--white/--ink)` + `--tilt`, `.tape(--blue/--lilac/--butter)`,
  `.chip(--pink/--blue/--lilac/--white/--accent)` + `.dot(--live/--build)`, `.btn(--blue/--white/--accent)`,
  `.more(--caps)` ("for more information »"), `.micro(.micro--row)`, `.shead` via `<SectionHead no label title>`,
  `.phead` via `<PageHead label title giant micro>`, `.stage` via `<PatternStage>`, `<GiantWord>`,
  `<VerticalText>`, `<RotatingBadge>`, `<Marquee>` (`.ribbon` for the ink ribbon), `<Flower>`, `<Spark>`,
  `<PopText load>` (letter pop), `.frame(--browser/--phone)` via `<DeviceFrame>`, `<TechChip>`, `<TechIcons>`.
- Motion classes (`src/styles/motion.css`): `.arrive` (+`--drop/--stick/--fade/--giant/--draw`, delay
  `--a` in beats; paused under the splash), `.reveal` / `.reveal-pop` / `.parallax` (CSS scroll-driven),
  `.twinkle`, `.float`, `.bob`, `.lean` (scroll velocity). Calm mode disables loops/transforms.
- Per-project accent: wrap in `style={accentVars(project)}`; use `--project-accent`, `-strong`, `-on-accent`,
  `--project-tint-50/100`, `--project-accent-2`.

## 13. Statistics hooks (when adding interactive things)
Clicks are captured from attributes — no code needed:
`data-track="<event>" data-track-id="<project or certification id>" data-track-target="<detail>"`.
Events (`src/lib/track.ts` `EVENT_TYPES` = the DB check list): page_view, page_dwell, section_dwell,
loader_timing, project_view, project_open, project_link_click, video_play, video_complete, image_open,
certificate_open, outbound_click, contact_start, contact_submit, copy_email, motion_toggle, filter_use,
not_found. Home sections: `data-track-section="<key>"`; page-level views: `data-track-view="project:<id>"`.
A new event type needs: `EVENT_TYPES`, the `analytics_events_type_check` constraint (migration + restore
point first), the cron rollup and the dashboard card. Admins (cookie), bots and `mw_nt=1` are never counted.

## 14. Gotchas & lessons learned
- **React dev StrictMode runs effects twice**: never "arm" DOM nodes with a marker class in an effect that
  the second run then skips; dedupe page views; such bugs don't exist in production but break dev tests.
- `relativeTime(new Date())`-style clocks must live outside components (`react-hooks/purity`).
- MUI 9: `slotProps.htmlInput` (not `inputProps` on TextField), `slotProps.primary` on ListItemText, `sx`
  instead of Typography system props; floating labels misbehave with React 19 form resets — the contact form
  uses `FormLabel` above `OutlinedInput`.
- React 19 resets uncontrolled forms after an action: return submitted `values` and use them as `defaultValue`.
- The splash state machine: `show` (first visit) → `done`; `skip` for repeat visits/bots; the prepaint script
  hard-caps the splash at 6.5 s even if JS never loads. Never animate the sidebar while `show` (the FLIP
  target must not move).
- CSS scroll-driven reveals look "missing" in full-page screenshots — expected.
- `p` default margins on a giant decorative glyph inflate cards (the 404 "404" needed `margin: 0`).
- Headless Chrome: use GPU flags for video; unload beacons get dropped (the tracker also flushes on a 4 s timer).
- Cloudinary MCP `sign-upload` adds `upload_preset` + `audit_context`; echo all params. The presets have
  `disallow_public_id` → admin uploads get random public IDs inside the folder (fine; the DB stores them).
- `bytea` columns round-trip as hex text (custom type in `schema.ts`) for both Neon drivers.
- Vercel MCP: list endpoints and `filter_project_envs` work; deployment detail/log endpoints and protected
  preview fetches return 403 (team scope). Use local `npm run build` to see build output.
- Neon MCP: `delete_branch` and destructive SQL require asking Kyle; connection strings carry the shared
  role password.
- Typed routes break `tsc` until `npx next typegen` runs after new routes. **While `next dev` is running**,
  `tsconfig` also includes `.next/dev/types/routes.d.ts`, which only lists routes the dev server has compiled
  since it started — visit the pages (or restart dev) before `tsc`.
- If the dev server suddenly serves the 404 page for routes that exist (production fine), it's stale dev state
  (seen after running `next typegen` / a Turbopack cache compaction while dev was running): **restart the dev
  server** (`preview_stop` + `preview_start`). Don't debug the code first.
- `import.meta.main` isn't in `@types/node` 20 → use `process.argv[1]?.endsWith("<file>.mts")` guards.
- The scratchpad is wiped between sessions: anything reusable goes in the repo or in this file.
- Kotoha capture traps: the long News section swallows wheel glides; the language switch is JS-rendered; the
  loader is removed from the DOM; block `/api/track`; the first desktop frame (~1.2 s) is blank.

## 15. Worked examples

### Himawari Visual Novel Studio and Engine (2026-10-23, project id 11): a desktop app + its website, on Windows
- First project done on the **Windows** machine. What changed there: Chrome is
  `C:/Program Files/Google/Chrome/Application/chrome.exe` (no GPU flags needed); `ffmpeg-static` gives `ffmpeg.exe` (the
  gyan.dev build **has** `drawtext`: `fontfile='C\:/Windows/Fonts/arial.ttf'`); run `.sh` scripts with `bash`; contact sheets
  with the repo's `sharp`; the §11.5 runner was rewritten in Node (`fetch` + `FormData`, same rule: echo every signed param).
- **Owner's exception to "never link source code":** Himawari is open source, so it links its GitHub repo (`other`,
  label "Source code") and `releases/latest` (`exe`, never a version-pinned file). Other projects keep the rule.
- App media without running the app: the engine repo's own `docs/images/*.png` (real Studio captures) as `window`-framed
  gallery shots, first in the gallery so a Studio shot is the cover. The video is the website (`capture/himawari.mts`):
  smooth `scrollTo` per section id, 6 cuts + end card → 27.5 s, 2.5 MB; hover = the feature rows (the hero barely moves).
- The local `.env.local` couldn't log in (old password), so `seed-himawari.mts -- --sql <file>` writes the whole seed
  (tech catalog upsert + project + rows, ids resolved by slug/public_id sub-selects) as statements for the Neon MCP
  `run_sql_transaction`. Reuse that pattern for future seeds.
- New tech with logos: C, CMake, CodeMirror, pnpm, Model Context Protocol, Claude, Vitest, GitHub Actions, Astro, Preact
  (+ monograms SDL 3, FreeType). A newly published project shows on its page at once, but Home/History only after the
  next build or ISR refresh, and new icon keys need the code deploy (until then they render as monograms).

### Moeko Works Portfolio (2026-10-14, project id 10): this site as a project
- `scripts/capture/moekoworks.mts` (captures production with `mw_nt`, emulated fine pointer so Lenis/hover previews
  work; the splash shot uses a fresh session), `encode-moekoworks.sh` (5 cuts + end card → 23 s, 3.9 MB),
  `seed-moekoworks.mts`. 13 stills (10 desktop + 3 phone), no admin shots and **no "For admins" operations** (owner).
- Dated by the owner: `started_on` **and** `published_at` = 2026-01-20 (the seed pins `PUBLISHED_AT`), so it is
  the oldest project: No.01; Kotoha became No.02, Hanon No.03 (still Latest).
- New tech: Simple Icons (logo added to `tech-icons.ts`), Playwright (monogram), FFmpeg.

### Hanon Fan Site (2026-10-11, project id 5)
- Same code base as Kotoha, so `hanon.mts` is `kotoha.mts` with `SITE`/`OUT` changed (same selectors, same
  `/api/track` block). Capture: 8 desktop + 2 phone shots, 1027 frames / 30 s screencast.
- Edit `[0.6–23.6] ⨯fade 0.4⨯ [26.4–30.3] ⨯fade 0.5⨯ end card 2.2 s` → 28 s, 5.6 MB; hover 5.5–13.5 s (0.54 MB).
- Accents `#79B5FF` (Hanon's bright brand blue; her image colour `#B7D7EF` is too pale as a fill) / `#FFD66B`
  (penguin gold). 15 tech (new: PGlite), 23 operations (11 visitor · 6 admin · 6 system), 12 media.
- Published at Kyle's request. Admin screenshots not added yet (see PROGRESS.md).

### Kotoha Fan Site (what "done" looked like)
- Record: title "Kotoha Fan Site", slug `kotoha-fansite`, tagline 150 chars, 3-paragraph description,
  category web, platforms web, lifecycle live, role "Solo developer: design, front end, back end, admin
  panel, analytics", started 2026-09-26, accents `#FE9FB9` / `#63A23D` (strong `#B55171`, on-accent ink),
  link live `https://kotoha-fansite.vercel.app/` (primary), credits (Kotoha · AiceClass; Fan artists),
  fan-site disclaimer.
- Stack: 16 technologies with usage notes (HTML5, CSS, JavaScript, GSAP, Lenis, canvas-confetti, Lucide,
  Animate.css, Node.js, Vercel, Neon, PostgreSQL, Cloudinary, Argon2id, YouTube embeds, sharp).
- Operations: 10 visitor · 6 admin (5 with admin screenshots) · 4 system.
- Media (19): preview (29.1 s, 1280×720, 7 MB) · hover (8 s, 854×480, 0.66 MB) · 10 public shots (8 desktop
  browser-framed + 2 phone) · admin statistics + activity in the gallery · 5 admin shots on operation cards.
- Files: `scripts/capture/kotoha.mts`, `scripts/capture/encode.sh`, `scripts/seed-kotoha.mts`;
  Cloudinary `moekoworks-official/projects/kotoha-fansite/{preview,hover,home,about,news,discography,gallery,
  lightbox,japanese,loader,phone-home,phone-gallery,admin-*}`.
- Timeline of the real run: capture shots (~1 min) → video (32 s capture) → encode (~1 min) → sign + upload
  12 files (~30 s) → seed (dry-run, run) → verify pages → commit/push → preview → checkpoint → merge →
  production smoke check. Admin shots (S4) added later the same way (branch created → anonymised →
  captured → branch deleted).
