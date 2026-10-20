# Handoff — emergency rebrand to Moeko Works (cloud → local, 2026-10-20)

Written at the end of a cloud session so a local Claude session can continue without the chat history.
Read this first, then `docs/PROGRESS.md` → "Incident log" (the full record) and `CLAUDE.md` (rule 10 is new).

## 1. Why
The old brand name is already used by an established company unrelated to Kyle. Owner's order: replace
**everything** that points or hints to the old name with **Moeko Works**, immediately. It's logged as a major
incident in `docs/PROGRESS.md`.

## 2. Where the work is
- Branch **`claude/kind-mccarthy-89dx0w`**, commit `b660207` "Emergency rebrand: Moesoft → Moeko Works" (+ this file).
- **Not merged into `dev` or `main`.** Nothing is live yet. Production still shows the old brand.
- Get it locally:
  ```bash
  cd ~/Desktop/Moesoft/moesoft_official
  git fetch origin claude/kind-mccarthy-89dx0w
  git checkout claude/kind-mccarthy-89dx0w
  npm ci
  ```
- Merging: the usual flow is `dev` → `main`, and `main` = production. Merge only with Kyle's OK and **only after
  owner step 2 below** (the Vercel domain). Otherwise canonical URLs, the sitemap and OG point at a domain that doesn't exist.

## 3. Done (verified in the cloud)
| Area | Result |
|---|---|
| Copy & metadata | All "Moesoft" → "Moeko Works" in `src/` (titles, descriptions, JSON-LD, manifest, alt texts, footer, sidebar, mobile menu, badge, giant words, vertical text, privacy). `site.legalName` removed; `site.name` is used instead. |
| Tagline | "software and technologies" → **"creative websites and systems"** (placeholder, Kyle may change it). |
| Logo | `public/brand/moekoworks-logo.svg` + `moekoworks-splash.svg` (git-renamed from the old files). Same flowers, colours, outline and shadow; wordmark "M✿eko Works" in Lilita One; tagline as vector Fredoka paths. **viewBox 126 252 3000 653** (was 2084 wide). All `<img>` width/height attributes updated. Mobile bar logo 127 → 150 px (`src/styles/shell.css`). |
| Splash animation | Same CSS animations; ids `ms-*` → `mw-*`; wipe clip 2360 wide, type clip x 1228 w 1440. Checked frame by frame. |
| Pattern | `public/brand/pattern.svg`: glyphs f/t → k/r, the 4 M copies at rotate(−18.4) → W. |
| OG image | `src/app/opengraph-image.jpg` redrawn (1200×630); alt text updated. |
| `assets/` | `moekoworks_logo.png` (2400×1200, transparent), `.pdf` (1 vector page), `.gif` (1200×600, 150 frames of the splash). Old files git-renamed/replaced. |
| Storage keys | `ms_motion/ms_nt/ms_splash` → `mw_*`. The pre-paint script in `src/app/layout.tsx` migrates old `ms_motion`/`ms_nt` once. |
| Session cookie | `__Host-mw_session` / `mw_session` (`session.ts`, `proxy.ts`, `api/track`). **Kyle must sign in again after deploy.** |
| Defaults | Site URL `https://moekoworks.vercel.app`; Cloudinary root `moekoworks-official`; presets `moekoworks_{images,videos}_signed`; package name `moekoworks-official` (also in `package-lock.json`); CSV `moekoworks-statistics-*`; admin UA; password blocklist. |
| Scripts | `seed-moekoworks.mts` (`npm run seed:moekoworks`, slug `moekoworks-portfolio`), `capture/moekoworks.mts`, `capture/encode-moekoworks.sh`, perf scripts use the `mw_*` keys. |
| DB migration | **`scripts/rebrand-moekoworks.mts`** (new, never run). It scans every text/jsonb/array column of the content tables (skips `public_id`, `slug`, enums) and rewrites the old name. It also renames project slug `moesoft-portfolio` → `moekoworks-portfolio` and keeps the old slug in `project_slug_history` (301). Dry run by default; `--apply` writes it all in one transaction. It prints the rows it can't rewrite automatically. |
| Docs | `CLAUDE.md` (title + rule 10), `README.md`, `PRELIMENARYPLAN.md` (rename note at the top), playbook, performance plan, progress. Real infra names that still exist (repo `moesoft_official`, Vercel project `moesoft`, Neon project/DB/role, local folder `~/Desktop/Moesoft/`, old site `moesoft-web`) are **kept literal on purpose** until Kyle renames them. |
| Checks | `npm run typecheck` ✅ · `npm run lint` ✅ · `next build` compiles + TypeScript ✅. Page-data collection stopped because the cloud had no `DATABASE_URL`; the baseline build stopped at the same step, so **do a full `npm run build` locally**. A search of `src public scripts` finds 0 old-name hits (only `rebrand-moekoworks.mts`, which splits the word on purpose). |

## 4. Not verified — do these first locally
1. `npm run build` (full, with `.env.local`), then `npm run dev` and look at Home (hero logo, splash, giant
   "MOEKO WORKS" word, vertical text "Moeko / Works / Since 2026", badge), the sidebar, the mobile bar (≤ 390 px),
   the footer, About, Privacy, admin login. The cloud could only render the SVGs, not the running app.
2. Check that the splash → sidebar "flying logo" still lands correctly with the wider aspect ratio (`SplashController.tsx`).
3. The giant words are longer now (11 letters vs 7). They're cropped on purpose, but check they still look intended.

## 5. Owner (Kyle) steps — none could be done from the cloud
The Vercel API returned 403 for scope `pastelsalts-projects`. Neon, Cloudinary and Canva connectors were unavailable.
1. **Canva** `https://www.canva.com/design/DAG9mW5bZm8/...`: change the wordmark to "Moeko Works" and the tagline. If Kyle
   exports a new logo, swap it into `public/brand/` (keep the ids `mw-pink/mw-purple/mw-o/mw-word/mw-tag` +
   `mw-wipe-clip/mw-type-clip` in the splash, or update its `<style>`).
2. **Vercel** (project `moesoft`, `prj_iiroJzD4wL9Iw2ImeYHrxBZX05k3`): add the domain `moekoworks.vercel.app`, redirect
   `moesoft.vercel.app` to it, and set `NEXT_PUBLIC_SITE_URL` if it's defined. Optionally rename the project. **Before the merge.**
3. **Neon:** take a restore point (hard rule 5) → `npx tsx scripts/rebrand-moekoworks.mts` → review → `--apply` →
   revalidate (save a project in the admin, or redeploy).
4. **Cloudinary:** create presets `moekoworks_images_signed` / `moekoworks_videos_signed` (copies of the old ones,
   tag `moekoworks`), **or** set `CLOUDINARY_ROOT_FOLDER` / `CLOUDINARY_PRESET_IMAGES` / `CLOUDINARY_PRESET_VIDEOS`
   in Vercel to the old values for now. Otherwise admin uploads break. Existing media URLs still contain
   `moesoft-official/…`. Moving them (rename public_ids + update `media_assets.public_id`) is a separate job that needs approval first.
5. **E-mail** `moekosoftware@outlook.com` still reads "Moeko Software". Waiting for Kyle's new address (`src/lib/site.ts`, 2 places).
6. Optional: rename the GitHub repo, the Neon project/DB/role, the local folder, and remove the old `moesoft-web` site.
7. After the deploy: OG debuggers (Facebook/X/LinkedIn), resubmit the sitemap in Search Console.

## 6. How the logo was rebuilt (to redo or tweak it)
The cloud scratchpad is gone. The method:
- Fonts: after `npm run build`, `.next/static/media/` holds Lilita One (`c432471d…woff2`) and Fredoka (variable, `5d52bd6c…woff2`).
- Write an HTML page holding one inline SVG in final coordinates (`viewBox="126 252 3000 653"`, 3000×653 px):
  - Lilita One at **font-size 388.5**.
  - Lilac shadow `#E2A9F1`: "M" at (783.95, 609.57), "eko Works" at (1355.44, 609.57).
  - Black outline (`fill:none; stroke:#000; stroke-width:13; stroke-linejoin:round`): "M" at (766.79, 592.40), "eko Works" at (1338.27, 592.40).
  - Tagline: Fredoka 700, 104 px, `#3a3a3a`, centred at x 1942 / baseline 752, skewX(−9).
- Print it to PDF with Playwright-core (local: `/usr/bin/google-chrome-stable`), then `pdftocairo -svg` turns the
  text into glyph paths. Multiply the pt coordinates by 4/3 and offset by +126, +252
  (`transform="matrix(1.333333,0,0,1.333333,126,252)"`).
- Splice those glyph groups into the splash SVG in place of `mw-word`/`mw-tag`; the flowers are unchanged. The static
  logo = the splash without `<style>` and without the two wipe clip paths.
- Pattern glyphs use the same font size (388.5, baseline 0), centred with `translate(-cx, -cy)` of the glyph bbox
  (k: −111.0 136.4 · W: −185.1 136.0 · r: −79.8 97.9).
- Local machine note (playbook §2.1): no system ffmpeg/ImageMagick. Use `ffmpeg-static` and the repo's `sharp`.
  `pdftocairo` comes from poppler. Ask before installing anything (hard rule 8).

## 7. Next steps for the local session
1. Check out the branch and run section 4.
2. Fix anything that looks off. Commit + push to the same branch.
3. Tell Kyle which owner steps are still open (section 5). Merge `→ dev → main` only after his OK and step 2.
4. After the merge: confirm production, then mark the incident resolved in `docs/PROGRESS.md` and delete this
   handoff file (or move its open items into PROGRESS.md).
