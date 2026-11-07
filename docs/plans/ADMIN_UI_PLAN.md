# Moeko Works — Admin Panel UI Refresh (front end only)

| | |
|---|---|
| **Status** | **v0.2 (2026-10-25): B1–B5 coded on `admin-ui-refresh` (`e87693f`), not merged. Superseded on 2026-11-03 by `docs/plans/ADMIN_UI_KOTOHA_PLAN.md`** (Kotoha-style v2, waiting for the owner's OK) |
| **Scope** | How the admin panel (`/admin/*`) and the sign-in pages (`/admin/login`, `/admin/change-password`) **look and lay out**. The Dashboard and Statistics get the most work; every other screen gets the shared component polish |
| **Not changing** | The database and migrations, `src/server/**` (queries, actions, auth, analytics), the API routes, the tracker, roles and sessions, the CSP/security headers, the public site |
| **Reference** | Kotoha's refresh `../kotoha-fansite/docs/plans/ADMIN_UI_PLAN.md` (commit `dc82320`, live 2026-10-25) and Hanon's port `../hanon-fansite/docs/plans/ADMIN_UI_PLAN.md` (commit `27caad2`). Same goals and rules; this file only adapts them to a Next.js + MUI admin |
| **Branch** | `admin-ui-refresh` from `dev`; merge to `main` (= production) only with the owner's OK |
| **Resume file** | This file (§9 is the checklist). `docs/plans/PROGRESS.md` stays the source of truth for everything else |

---

## 0. Ground rules for this update

1. **Front end only.** Files allowed to change: `src/app/admin/**` (pages, layouts, `admin.css`), `src/components/admin/**`, and `src/lib/admin-format.ts` (display labels only). Nothing under `src/server/**`, `drizzle/`, `scripts/`, `src/app/api/**`, the public pages, `src/theme/theme.ts` (the MUI theme is shared with the public contact form), `next.config.ts`, `vercel.json`.
2. **Existing data only.** Every number, list and label comes from what the admin pages already read: the counts on the Dashboard, `getStats(range)` from `src/server/admin/stats.ts`, the projects/certifications/messages/activity rows. Totals, splits and percentages may be **calculated in the component**. The Dashboard may call the **existing** `getStats(7)` and reuse the Messages page's existing unread-list query; no new tables, columns, server actions or API routes. (If a screen needs a query that doesn't exist yet, it's listed in §10 and asked first.)
3. **No new features, no new libraries.** Same stack: Next 16 App Router, React 19, MUI 9, Lucide, plain CSS in `@layer components`, hand-written SVG charts. No dark mode, no drag-and-drop, no new pages, no bulk actions beyond what Messages already has.
4. **Keep every behaviour.** Routes and URLs (incl. `?range=` / `?env=` / message filters), forms, validation messages, the project editor's save / save & publish / unpublish / archive flow, uploads, slug history, forced password change, sign-out, the "Count my visits" switch, CSV export, `requireAdmin()` on every page and action.
5. **Project rules still apply** (`CLAUDE.md`): `requireAdmin()` stays first in every page, keyboard reachable, visible focus, `prefers-reduced-motion` respected, ≥ AA contrast, MUI 9 conventions (`sx`, `slotProps`), English only, no secrets, commit + push after each verified step.

---

## 1. Current state (analysis, 2026-10-25)

### 1.1 Structure

| File | Lines | Role |
|---|---|---|
| `src/components/admin/AdminShell.tsx` | 132 | MUI permanent drawer (desktop) / temporary drawer + app bar (phone), 8 nav links, View site, Sign out |
| `src/app/admin/admin.css` | 160 | Shared bits (`admin-label`, tabs, pager), messages, statistics (`stiles`, `scard`, `bars`, `hours`, `vchart`), editor, certifications |
| `src/app/admin/(panel)/page.tsx` | 56 | Dashboard: 3 count tiles (published projects + drafts, certifications, unread messages) |
| `src/app/admin/(panel)/statistics/page.tsx` | 247 | 7 KPI tiles, range tabs, env switch, CSV, visits chart, 15 breakdown cards |
| `src/components/admin/VisitsChart.tsx` | 96 | Daily / weekly / monthly SVG bars (visits + uniques) |
| `src/app/admin/(panel)/projects/page.tsx` + `ProjectEditor.tsx` | 72 + 348 | Project list (table) + the long editor (basics, media, links, tech, description, operations, credits, SEO) |
| `certifications`, `tech`, `messages`, `activity`, `account` pages + their components | ~600 | One screen each |
| `login`, `change-password` + `LoginForm`, `PasswordForm` | ~210 | Paper card with the logo, password rules checklist (○ ✓ ✗ characters) |

### 1.2 Data the admin already has

- **Dashboard:** `projects` published / draft counts, published `certifications`, unread `contact_messages`.
- **`getStats(range, allEnv)`** (`src/server/admin/stats.ts`): `kpi.today / week / month` (visits + uniques, **fixed periods**), `kpi.visitsInRange`, `kpi.avgVisitMs`, `kpi.avgLoadMs`, `kpi.unread`, `kpi.messagesInRange` (**range-based**), `series` (daily visits + uniques), `pages`, `sections`, `projects` (views, plays, clicks, CTR, image opens), link clicks by type, video plays, certificates viewed, contact `funnel`, social & e-mail clicks, sources, countries, devices, browsers & OS, languages, `hours[24]`, motion preference, 404s.
- **Lists:** projects (title, slug, status, published / updated dates), certifications (title, date, image), technologies (+ usage counts), messages (status, star, sender, subject, snippet, date), activity log (latest 200: time, action code, summary), account (username, sessions, count-my-visits).

### 1.3 What works well (keep)

- Server components with `requireAdmin()` everywhere; actions in `src/server/admin/*`.
- The statistics data set is rich (Kotoha's KPIs + all plan §12 cards) and exports to CSV.
- The project editor covers every field with signed uploads, previews and a sticky save bar.
- Messages: folders, search, star, bulk actions, reply by e-mail.

### 1.4 UI problems found

**Dashboard**
1. **Almost empty.** Three tiles; no visitor numbers, nothing waiting for attention (drafts, unread messages) beyond a count, no recent activity. Everything useful lives one click away.
2. **Drafts are a footnote** ("4 drafts" in small grey under the published count).
3. Tiles aren't links and have no icon tying them to the sidebar.
4. Layout is an inline `style={{ display: "grid" … }}`.

**Statistics** (same problems Kotoha had)
5. **Two kinds of numbers look identical.** *Today / This week / This month* ignore the range; *Avg. visit*, *Avg. loading*, *Messages* follow it; *Unread* is "now". All seven are the same tile under the range tabs.
6. **The range control sits above everything**, though it doesn't change the KPI strip's first three tiles.
7. **Visits chart:** only the native `<title>` tooltip (slow, invisible on touch, no keyboard), no total for what's shown, legend under the chart.
8. **Fifteen breakdown cards in one ungrouped grid**, all the same weight.
9. Loading = nothing until the server renders; a range switch reloads the whole page with no busy state.

**Shell / shared**
10. **Generic MUI look**: a white drawer with pink pills. None of the public site's Bloom Expo vocabulary (paper, tape, stickers, pattern stage, Lilita One numbers), so the admin doesn't feel like the same product.
11. **Flat list of 8 links**, no grouping between content, insights and account; leftover `ready` / "soon" chip code although every page is ready.
12. **Page numbers are off:** Dashboard No.00, Project History No.01, Certifications No.02, **Statistics No.04**, Messages No.05, Tech No.06, Activity No.07, Account none; there's no No.03, and the order doesn't match the sidebar.
13. **21 inline `style={{ }}`** in admin pages/components instead of classes.
14. **Tables everywhere** (projects, activity, top projects) with no thumbnails or icons; activity shows raw codes (`project.publish`).
15. **Empty states** are a grey line ("Nothing yet."); errors are MUI alerts with no shared look.
16. **Certifications:** 22 entries, incl. 6 term grade reports, in one undivided grid.
17. **Sign-in / change password:** plain paper card; rules checklist uses ○ ✓ ✗ characters.

---

## 2. Goal

A **calmer, clearer admin** that clearly belongs to Moeko Works: the Dashboard answers *"what's on the site, what's waiting for me, how are visitors doing"* at a glance, Statistics separates "fixed" from "this period" numbers, and every other screen uses the same tidier components. Same data, same features, same behaviour.

---

## 3. Design direction

- **Follow the actual site theme** (the owner's rule for Kotoha's real version): the admin borrows Bloom Expo's **tokens and a few signature pieces** from `src/theme/tokens.css` / `src/styles/components.css`, not the whole scrapbook.
  - Page: the canvas with the faint dot pattern (as today), plus the pink/blue watercolour corners kept subtle.
  - Surfaces: white paper cards, 1 px hairline + `--shadow-paper`; **tape** only on the welcome card and the sign-in card.
  - Titles: the `admin-label` micro line ("No.00 — Dashboard") stays; page titles in Fredoka 700; **big numbers in Lilita One** (the logo face) for KPIs only.
  - **Sticker headings** (`.sticker` style, small) for the dashboard's three blocks.
- **Colour meaning fixed:** pink (`--pink-700` text / `--pink-300` fills) = **site content**; blue (`--blue-700` / `--blue-300`) = **visitors**; lilac = messages; grey dashed = draft; red = danger; butter = warning. Pills, tiles, chart bars and the sidebar follow it.
- **Hierarchy through type and space**, not borders. Tabular numerals everywhere numbers sit in columns.
- **Motion:** button lift and short fades (skeleton → content, toasts) only; all off under `prefers-reduced-motion` and the site's calm mode.
- **MUI stays** for inputs, buttons, dialogs, snackbars and the drawer. Restyling happens in `admin.css` (`@layer components`, scoped under `.admin-root`) and component `sx`, never in the shared theme.

---

## 4. Dashboard (main work)

```
┌ ✿ Hello, Kyle! ─────────────────── Sat 25 Oct 2026 · PH ──┐  (taped paper card)
│ "Here's what's on the site and what's waiting for you."      │
├──────────────────────────────────────────────────────────────┤
│ [sticker] SITE CONTENT                                        │
│ [🗂 Projects 6 | 0 drafts] [🏅 Certifications 22] [🔷 Tech 41] │  ← each tile links to its page
│ Latest: Aqua Iro Archive · published 24 Oct      [Open →]     │
├──────────────────────────────────────────────────────────────┤
│ [sticker] WAITING FOR YOU                                     │
│ ✉ 2 unread messages  → newest 3 (sender · subject · time)     │
│ ✎ Drafts: none / list of draft projects with "Continue"       │
├──────────────────────────────────────────────────────────────┤
│ [sticker] VISITORS · LAST 7 DAYS                              │
│ Today 34 · 20 unique | This week … | This month …            │
│ ▁▃▅▂▇▆▃ (small 7-day chart, hover/focus value)   [Statistics →]│
├──────────────────────────────────────────────────────────────┤
│ RECENT ACTIVITY  (last 5 entries, readable labels)  [All →]   │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Welcome card
- Existing greeting + today's date in Manila time (`Intl`, as `dateTime()` already does). The "Password changed" alert stays, styled as a success note inside the card.

### 4.2 Site content tiles
- Projects (published, **draft pill** only when > 0, thin published/draft split bar), Certifications (count), Tech catalog (count). Same Lucide icon as the sidebar link; whole tile is a link.
- "Latest" line from the newest published project (already in the projects query: title, `published_at`).

### 4.3 Waiting for you
- **Unread messages:** count + the newest 3 unread (reuse the Messages page's existing list query, limited to 3), each linking to the message.
- **Drafts:** the draft projects (from the projects query), each with "Continue editing"; "Nothing waiting ✿" when both are empty.

### 4.4 Visitors
- `getStats(7)` (existing): the fixed-period strip (Today / This week / This month, number + "N unique") and a compact 7-day `VisitsChart` (same component, §5.3), with a link to Statistics.

### 4.5 Recent activity
- The newest 5 activity rows with **readable labels and icons** (`project.publish` → "Published a project", via a small map in `admin-format.ts`; unknown codes fall back to the raw code).

---

## 5. Statistics

### 5.1 Toolbar and KPIs
- **Fixed-period strip first** (Today / This week / This month), visually distinct (no range tabs above it).
- **"Details for [7 | 30 | 90 | 365 days]" block below**, with the range tabs **in its heading**, together with the KPIs the range actually drives: visits in this period, Avg. visit, Avg. loading, Messages in range. *Unread now* moves to the Dashboard/Messages (still linked here as a small chip).
- Env switch ("Include previews & dev") and **Export CSV** stay in the toolbar, unchanged URLs.

### 5.2 Breakdown cards, grouped
Same 15 cards and data, under four small headings:
- **Content:** Pages · Home sections · Top projects (wide table, with the project cover thumbnail from the existing project rows if available, else an icon) · Link clicks by type · Video plays · Certificates viewed
- **Audience:** Countries · Devices · Browsers & OS · Browser languages · Motion preference
- **Traffic:** Sources · Social & e-mail clicks · Busiest hours (PH time, peak hour highlighted)
- **Contact & errors:** Contact funnel · Not found (404)

Bar lists: slightly taller tracks, values right-aligned in tabular numerals, rank number from the array index; colours by meaning (§3).

### 5.3 Visits chart (`VisitsChart.tsx`, used on both pages)
- Taller on desktop, 3 light grid lines (0, ½, max), legend in the card header, **total visits + uniques for what's shown** (summed in the component).
- **Value label on hover, focus and tap**: one positioned label; bars become focusable (`tabIndex`, ←/→ move); the `<title>` stays for screen readers.
- Phones: fewer tick labels (every 7th day on daily) instead of shrinking text.

### 5.4 Loading and empty
- `loading.tsx` for `/admin/statistics` and `/admin` with **skeleton cards at their final size** (CSS only), so a range switch shows a busy state instead of a frozen page.
- "No data yet" boxes use the shared `.state` look (§6).

---

## 6. Shell and shared components (all screens)

| Area | Change |
|---|---|
| Tokens | Admin-only tokens in `admin.css` built from the public ones (`--pink-*`, `--blue-*`, `--lilac-*`, `--paper`, `--ink`, `--shadow-paper`, radii): surface, hairline, content colour, visitors colour, messages colour |
| Sidebar | **Groups:** *Content* (Projects, Certifications, Tech catalog), *Insights* (Dashboard, Statistics, Activity), *Inbox* (Messages + unread badge), *You* (Account). Floating paper panel, logo at the top, sticker-style active link (pink fill + ink text), View site + Sign out at the bottom. Remove the unused `ready` / "soon" code |
| Phone nav | Keep MUI's temporary drawer (it already has the scrim, Esc and focus return); restyle it like the sidebar; app bar shows the page title |
| Page head | One `AdminPageHead` component: `No.xx — Section` micro label, title, optional hint + actions. **Numbers follow the sidebar order** (fixes problem 12) |
| Tables → rows | Projects list: cover thumbnail (first gallery image, already loaded by the editor query, or an icon), title + slug, status pill, dates. Activity: icon + readable label + summary. Top projects keeps a table (it's numeric) |
| Certifications | Two groups on the screen, **Certificates** and **Grade reports** (title starts with "Grades:", the same rule the public About page uses), newest first; same form and actions |
| Messages | Same list and actions; lilac accent for unread; detail page meta grid tidied |
| Editor | Same fields and save flow; a **section jump list** (Basics · Media · Links · Tech · Description · Operations · Credits · SEO) in the sticky bar; section cards with consistent headers |
| Empty / error states | One `.state` style (icon + text + optional button) for lists, statistics and the dashboard |
| Inline styles | The static `style={{ }}` → classes in `admin.css`; only data-driven values stay inline (bar widths/heights, background images, sender bubble colours, colour swatches, chart label position) |
| Sign-in / change password | Same forms and behaviour; taped paper card on the canvas, logo, sticker title; rules checklist with Lucide check/x icons (same rule texts) |

---

## 7. Files

**Will change:** `src/app/admin/admin.css` (most of the work), `src/components/admin/AdminShell.tsx`, `VisitsChart.tsx`, `ProjectEditor.tsx` (jump list + class names only), `CertificationManager.tsx` (grouping), `MessageList.tsx`, `LoginForm.tsx`, `PasswordForm.tsx`, every page under `src/app/admin/(panel)/` (layout/markup only), `src/app/admin/login/page.tsx`, `src/app/admin/change-password/page.tsx`, `src/lib/admin-format.ts` (activity labels), new `src/components/admin/{AdminPageHead,StateBox}.tsx`, new `loading.tsx` for `/admin` and `/admin/statistics`, `docs/plans/PROGRESS.md`, this file.

**Will not change:** `src/server/**`, `drizzle/**`, `scripts/**`, `src/app/api/**`, `src/app/(site)/**`, `src/components/{site,projects,decor}/**`, `src/theme/**`, `src/proxy.ts`, `next.config.ts`, `vercel.json`. If a bug turns up there, ask first.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Breaking a CRUD flow while touching markup | No logic or action changes; full regression pass (§9 B6) with a throwaway admin (playbook §11.6) |
| Restyling MUI leaks into the public contact form | Admin styles scoped under `.admin-root`; the shared theme file is not touched |
| Dashboard gets slower (it now calls `getStats(7)`) | One extra existing query; measured before/after on the dev server; drop the chart to a link if it's noticeably slower |
| No way to see real data locally | `.env.local` still has the pre-rotation DB password (§10 Q4) |
| Owner prefers the current look | B1 is a CSS-only token/surface pass reviewed before anything else (✋1) |

---

## 9. Phases & checklist

Legend: `[ ]` todo · `[~]` in progress · `[x]` done & verified · ✋ = owner review

- [x] **B0** Owner approved the plan (2026-10-25); §10 defaults used
- [~] **B1** Tokens + surfaces in `admin.css`, sidebar restyle, page canvas → screenshots (desktop + phone) → ✋1
- [~] **B2** Shell: sidebar groups, `AdminPageHead` (fixed numbering), `StateBox`, inline styles → classes, remove `ready` code
- [~] **B3** Dashboard (§4) + `loading.tsx` skeleton
- [~] **B4** Statistics (§5): KPI split, range block, grouped cards, interactive `VisitsChart`, skeleton
- [~] **B5** Other screens: project rows with thumbnails, activity labels, certification groups, messages, editor jump list, sign-in + change password → ✋2 (screenshots of every screen)
- [ ] **B6** QA: 1920 / 1366 / 1024 / 768 / 390 px, no sideways scroll; keyboard-only walkthrough; reduced motion; AA contrast; regression of every flow: sign in, forced change, create project → edit → upload image → save → publish → unpublish → archive, certification add/edit/delete, tech add/edit, message read/star/archive/delete/reply link, CSV export, count-my-visits, sign out. Throwaway admin + its rows deleted afterwards. `npx next typegen && npx tsc --noEmit && npx eslint src && npm run build`
- [ ] **B7** Commit on `admin-ui-refresh` → push → ✋3 owner OK → fast-forward `dev` → `main` (deploys) → check production `/admin/login` and (owner) the panel; update `PROGRESS.md`

---

## 10. Questions for the owner (defaults used if not answered)

1. **Look:** follow the public Bloom Expo theme (paper, tape, stickers, pink/blue) like Kotoha's real version, or a plainer neutral admin with the brand colours only? *Default: follow the site theme (recommended, high confidence: it's what you asked for on Kotoha).*
2. **Dashboard content:** add *Waiting for you* (unread messages + drafts), a 7-day visitors strip and recent activity, all from existing data? *Default: yes (high confidence).*
3. **Sidebar groups** Content / Insights / Inbox / You, and renumbering the pages to match the sidebar order? *Default: yes (medium confidence; the labels are easy to rename).*
4. **Local preview with real data:** `.env.local` still has the old database password, so the local dev server can't reach the DB. Either paste the new connection string into `.env.local` before B1 (recommended: real screens + a throwaway admin for the regression pass), or I review on the Vercel preview of the branch only (you'd open it; it's behind Vercel login). *Default: ask you to update `.env.local` when B1 starts (high confidence).*
5. **Dark mode:** out of scope (it would double the styling work). *Default: not included.*
