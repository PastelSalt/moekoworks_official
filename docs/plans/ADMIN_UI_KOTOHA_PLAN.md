# Moeko Works — Admin UI v2: adapting the Kotoha admin (plan)

| | |
|---|---|
| **Status** | **v0.3 (2026-11-03): live on production** (`3007a5a`, merged on Kyle's OK without a local real-data pass; Kyle checks the signed-in screens on production) |
| **Why** | Kyle: the Kotoha admin is "way better". Take its layout, visual formatting and completeness, and adapt them to this project's data and theme. Also redo the sign-in page after Kotoha's |
| **Builds on** | Branch `admin-ui-refresh` (commit `e87693f`, v1 of `docs/plans/ADMIN_UI_PLAN.md`: grouped sidebar, page heads, dashboard blocks, grouped statistics, interactive chart). v1 is **not** on `main`. v2 continues on the same branch and replaces v1's look where this file says so |
| **Reference (read-only)** | `../kotoha-fansite/public/{admin.html,login.html}`, `public/css/admin.css` (490 lines), `public/js/admin/{main,pages,analytics,content,ui,login}.js`, `public/locales/admin/en.json`, live at kotoha-fansite.vercel.app/login |
| **Scope** | Look, layout and completeness of `/admin/*`, `/admin/login`, `/admin/change-password`. Same data, same server actions, same rules |

---

## 0. Ground rules (unchanged from v1, plus two)

1. **Front end only.** Allowed: `src/app/admin/**`, `src/components/admin/**`, `src/lib/admin-format.ts`. Not allowed: `src/server/**`, `drizzle/`, `scripts/`, `src/app/api/**`, the public site, `src/theme/**`, `next.config.ts`, `vercel.json`.
2. **Existing data and existing server actions only.** Pages may run **read** queries on existing tables (as they already do). Every write goes through an action that already exists: `setProjectStatus`, `createProject`, `saveProject`, `saveCertification`, `saveTech`, `bulkMessages`, `setMessageStatus`, `toggleStar`, `markReplied`, `deleteMessageForever`, `logoutAction`, `logoutOthersAction`, `changePasswordAction`, `loginAction`.
3. **No new libraries.** MUI 9 stays for inputs, selects, dialogs and the phone drawer. Lucide for icons. Charts stay hand-written SVG. No i18n (English only, rule 7), no dark mode.
4. **Keep every behaviour**: URLs and query params, forced password change, the slow-database hint, CSV export, the 365-day note, `requireAdmin()` first in every page and action.
5. **Follow the public Moeko Works theme** (owner rule from Kotoha): Kotoha's *structure and formatting*, Moeko's *colours, stickers, headings and ornaments*.
6. **No admin username or password in tracked files** (rule 1). The username is shown at runtime from the session only, never written in code or docs.

---

## 1. What makes the Kotoha admin better (analysis)

Compared screen by screen, Kotoha (live, `dc82320` + port to Hanon) against our `admin-ui-refresh` v1:

| # | Kotoha does | Moeko v1 does | Gap |
|---|---|---|---|
| 1 | **Strong page colour** (brand pink with white dots); every card is cream paper floating on it, so blocks read instantly | Pale canvas with faint dots; white MUI Paper on near-white | Low contrast between page and cards: everything blurs together |
| 2 | **Top bar** across the page: logo + "Admin" badge · user badge (avatar, name, role pill) · View site · Sign out | No top bar on desktop; brand, View site and Sign out live in the sidebar | No "who am I / get out" at a glance |
| 3 | **Floating sidebar panel** under the top bar; group labels with a little clover; active link = solid brand pill with a sticker shadow | Similar groups, but active link is an outlined pink pill; brand + buttons inside the sidebar | Close; needs the top bar split and a stronger active state |
| 4 | **Sticker page titles** (big, coloured, white text, clover) + a hint in a small paper pill | Plain Fredoka h1 + micro label | Titles don't feel like the brand |
| 5 | **Dashboard = one complete page**: welcome card (stitched border, sticker "Hello, name!", intro, date pill) → "Site content" tiles → the whole visitor-statistics block | Welcome strip, 3 small tiles, "Waiting for you", compact 7-day chart, activity | Kotoha's tiles are richer (icon, arrow, "N published", draft pill or "All published", split bar) and its stats live right on the dashboard |
| 6 | **Tiles**: 176px min, icon square top-left, arrow top-right that slides on hover, 34px number + "published", foot line, split bar | Smaller tiles, no arrow, no "published" unit, no "all published" state | Formatting |
| 7 | **Stats order that explains itself**: 3 fixed-period KPI cards with icons → Visits panel (title + total + Daily/Weekly/Monthly segmented, chart, legend under) → **range bar** "Details for: [7 days · 30 · 90 · 1 year] · N visits in this period" → 2 range KPIs → **group titles with a dashed rule** → stat cards with an icon in every title → privacy note on paper | v1 already split fixed vs range, but range block is a tinted box, groups have no rule, cards have no icons, ranks/values/track sit on one line | Formatting + icons + privacy note |
| 8 | **Bar lists**: rank · label · value on the first line, the track on its own line under it, first row darker | rank · label · track · value on one line (cramped on phones) | Formatting |
| 9 | **Chart**: drawn at the box's real width (tick text always 11px), hover band behind the column, dark label with the period's long date, value label positioned above the bar and kept inside the box | v1: viewBox scaling (text shrinks on phones), label beside the bar | Formatting |
| 10 | **Lists are cards with actions**: thumbnail or icon square · title · meta line (date in brand colour + status pill) · 2-line text · **Edit / Publish↔Unpublish / Archive** buttons right on the row; drafts are sunken with a dashed inset outline; **status filter** (All · Published · Draft) as a segmented pill; **primary "Add" button in the page head**; "Load more" | Projects: rows link to the editor only; no filter, no inline publish/archive. Certifications: one form + cards with only "Edit". Tech: a table | **Completeness**: you can't publish, unpublish or archive from a list; no filters |
| 11 | **Archive page**: everything archived, with Restore | Archived projects/certifications are only visible mixed into their lists | **Completeness** |
| 12 | **Activity**: card rows, icon per verb (plus, pencil, eye, eye-off, archive, upload, log-in…), readable label, user pill, time, details line | v1: list with readable labels + icons per area | Close; switch to Kotoha's per-verb icons + user pill |
| 13 | **My Account**: account card (avatar, name, role pill, "Sign out other devices") + password panel | Three plain Paper cards | Formatting |
| 14 | **Toasts** bottom-right with an icon circle, colour by kind (ok / error / info), fade in/out; **confirm dialogs** with a dashed header line + coloured bar, optional "reason", sticky action row | MUI Snackbar in the editor only, no confirms (archive happens on click) | **Completeness** + safety |
| 15 | **States**: empty = dashed pink box with a big clover; error = red box with "Try again"; skeletons at the final size of KPIs/chart/tiles/rows | v1 `StateBox` (no border), generic skeletons | Formatting |
| 16 | **Controls**: pill buttons (primary solid with sticker shadow; ghost outlined 2px), segmented radio pills, 44px inputs with 2px borders and a soft focus glow, labels **above** fields | MUI defaults (floating labels, thin outlines), MUI ToggleButtons | Formatting |
| 17 | **Sign-in**: brand-colour dotted page, paper card with two ornaments sticking out of the corners, logo, small sticker title, labels above fields, "Show password", waking hint, full-width primary button, dashed foot line with "View site" | v1: taped card, MUI floating-label fields | Kyle asked for this one explicitly |
| 18 | **Phone**: top bar shrinks to icons, sidebar slides in over a scrim (Esc / tap outside / route change closes, focus moves in and back), tiles 2 per row, KPIs become compact rows | v1: MUI app bar + temporary drawer | Close; restyle to match |

**Conclusion:** keep v1's data work (it already reads everything Kotoha shows and more), and rebuild the *shell, typography, components and list screens* on Kotoha's patterns, re-themed to Moeko.

---

## 2. Theme mapping (Kotoha "Clover Scrapbook" → Moeko "Bloom Expo")

Values from `src/theme/tokens.css` and the public components (`src/styles/components.css`, `shell.css`). The admin keeps its own aliases in `admin.css`, scoped under `.admin-root`.

| Role | Kotoha | Moeko |
|---|---|---|
| Page | `pink-300` + white dots 26px | **`--pink-200` (#ffd3ee) + white dots 26px**, with the public watercolour washes (`/brand/wash-pink.svg` top-left, `wash-blue.svg` bottom-right) at low opacity. See Q1 for the pale alternative |
| Paper / sunken paper | `#fffaf2` / `#f7efe3` | `--paper` #fffdfe / `--gray-50` #fafafc (drafts, tracks, skeletons) |
| Hairline, dashed rules | `#eadfd3` | `--gray-200` / dashed `--pink-200` |
| **Brand = content** (primary buttons, active nav, tile numbers, links, bars) | green-700 solid, white text | **Public `.btn` look**: `--pink-300` fill, `--ink` text, 2px `--outline` border, `3px 4px 0 var(--lilac-300)` offset shadow; numbers/links in `--pink-700` (5.9:1 on paper) |
| Ghost buttons | 2px green-200 inset ring | 2px `--pink-200` ring, `--pink-700` text, hover `--pink-50` |
| **Visitors** (KPI numbers, visits chart, chart label, range accents) | pink | **blue**: `--blue-700` numbers (5.9:1), bars `--blue-200` / inner `--blue-500`, active `--blue-300` / `--blue-700`, hover band `--blue-50` |
| Messages | — | lilac/violet: `--lilac-100` fills, `--violet-700` text |
| Sticker titles | green gradient, white text, white 4px ring, clover | **Public `.sticker`**: `--pink-300` fill, `--ink` text, 2.5px `--outline`, `--shadow-sticker` (lilac offset), −2° tilt (calmer than the public −6°), flower icon. Variants: blue (visitors), lilac (inbox), butter (warnings) |
| Ornament (clover sprite) | `#cl-leaf` green / pink / white | **`/brand/flower-pink.svg`**, **`flower-purple.svg`**, **`flower-o.svg`** (already public assets, no new files) |
| Big numbers | Fredoka 700 | **Lilita One** (`--font-logo`), as on the public site's big numbers |
| Page titles | sticker | Sticker title (as Kotoha) **plus** the public section-head micro label "No.04 — STATISTICS" above it (keeps our numbering) |
| Draft | `paper-2` + dashed `#d3c2a9` inset | `--gray-50` + 2px dashed `--gray-300` inset 7px |
| Danger / warn / ok | red / amber / green | `--error` / `--warning` / `--success` (+ their `-50` fills) |
| Toasts | green ok, red error, slate info | `--success`, `--error`, `--ink` |
| Focus | 3px white + 3px pink-700 | `--focus-ring` (same, already in tokens) |
| Dialog backdrop / phone scrim | plum 50% | `rgb(46 26 54 / 0.5)` (the `--shadow-modal` hue) |

Contrast targets: body text ≥ 4.5:1 on paper and on the page colour (ink on `--pink-200` ≈ 11:1); sticker text ink on `--pink-300` ≈ 9:1.

---

## 3. Shell (all panel screens)

```
┌ TOP BAR (sticky, paper 97%, 2px dashed pink-200 bottom line) ─────────────────────────────┐
│ ☰(phone) [logo 112px] (ADMIN)                 [✿ avatar · username · Owner] [↗ View site] [⎋ Sign out] │
└────────────────────────────────────────────────────────────────────────────────────────────┘
┌ SIDEBAR (floating paper panel, r 28) ┐  ┌ VIEW (max 1640px) ─────────────────────────────┐
│  ▣ Dashboard                          │  │ No.04 — STATISTICS                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │  │ [✿ STATISTICS]  ← sticker title                 │
│ ✿ CONTENT                             │  │ (hint in a paper pill)          [actions …]     │
│  ▣ Project History                    │  │                                                 │
│  ▣ Certifications                     │  │ …page…                                          │
│  ▣ Tech catalog                       │  │                                                 │
│ ─ ─ ─                                 │  └─────────────────────────────────────────────────┘
│ ✿ INSIGHTS                            │
│  ▣ Statistics · ▣ Activity · ▣ Archive│   (new: §6.6)
│ ─ ─ ─                                 │
│ ✿ INBOX   ▣ Messages (2)              │
│ ─ ─ ─                                 │
│ ✿ YOU     ▣ My Account                │
└───────────────────────────────────────┘
```

| Piece | Spec (Kotoha value → ours) |
|---|---|
| Top bar | 64px high, sticky, `padding 0 18px`, paper 97% + soft pink shadow + 2px dashed `--pink-200` bottom. Brand: logo 112px + "ADMIN" pill (`--pink-50`, `--pink-700`, 1.5px `--pink-200` ring). Right: user badge (32px round avatar with a flower, username, "Owner" pill), ghost-sm "View site" (new tab), ghost-sm "Sign out" (form → `logoutAction`) |
| Sidebar | `position: fixed`, top = top bar + 14px, left 14px, width 232px, paper panel r 28, own scroll. Groups separated by 2px dashed hairlines; group label 12px bold `--ink-soft` with a 13px flower (pink for Content/You, purple for Insights/Inbox). Links 7px 12px, r 14, 600 weight; hover `--pink-50` + `--pink-700`; **active = public button look** (pink-300 fill, outline, lilac offset shadow). Messages shows the unread count pill (violet) |
| View | `margin-left: 232px`, padding `26px clamp(16px,3vw,40px) 64px 4px`, max width sidebar + 1640px |
| Page head | `AdminPageHead` (v1) restyled: micro label "No.xx — SECTION" (public `.shead__label` look with the pink dash), **sticker h1** (24px, 21px on phones), hint in a paper pill (14px, 600, r 12, paper 82%), actions on the right (primary "Add …" etc.) |
| Phone ≤ 900px | Top bar 64px with ☰, logo 96px, badge text and button labels hidden (icons only, `aria-label` kept). Sidebar = MUI temporary Drawer restyled as the same floating panel (MUI already gives scrim, Esc, focus trap and focus return); closes on route change |
| Skip link | "Skip to content" → `#main` (Kotoha has one; we don't) |

Data: the panel layout already has the session (`requireAdmin()`); pass the `username` to `AdminShell` for the badge. There are no roles in our schema (single admin), so the pill is a fixed "Owner" label.

---

## 4. Dashboard (Kotoha's page, Moeko's content)

```
┌ paper, stitched (dashed inset 7px) ─────────────────────────────── ✿ (flower sticking out) ┐
│ [✿ HELLO, KYLE!]  sticker                                      (📅 Mon 3 Nov 2026 · PH time) │
│ Here you can manage everything that appears on Moeko Works.                                   │
│ (✓ Password changed. Welcome to your admin panel ✿)  ← only after ?welcome=1                  │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
[✿ SITE CONTENT] sticker            (numbers below are examples)
┌ ▣ ─────────── → ┐ ┌ ▣ ─────────── → ┐ ┌ ▣ ─────────── → ┐ ┌ ▣ ─────────── → ┐
│ Project History  │ │ Certifications   │ │ Tech catalog     │ │ Messages         │
│ 12 published     │ │ 16 shown         │ │ 48 technologies  │ │ 2 unread         │
│ (1 draft) / All  │ │ 6 grade reports  │ │ 31 used on site  │ │ 14 in inbox      │
│ published        │ │ (2 hidden)       │ │                  │ │                  │
│ ███████████░░    │ │ ████████████░    │ │ ███████░░░░░     │ │ ██░░░░░░░░░░     │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
[✿ WAITING FOR YOU] sticker (lilac)   — only when something waits, else one small "Nothing waiting ✿" state
  unread messages (newest 3, bubble · name · subject · time) │ draft projects (title · last saved · Continue →)

[✿ VISITOR STATISTICS] sticker (blue)        (Visits to the live site, counted in PH time) note pill   [Full statistics →]
┌ ☀ Today ───────┐ ┌ 📅 This week ────┐ ┌ 🗓 This month ───┐
│ 34             │ │ 210              │ │ 812              │   (Lilita, blue-700)
│ 20 unique      │ │ 140 unique/day   │ │ 520 unique/day   │
└────────────────┘ └──────────────────┘ └──────────────────┘
┌ 📊 Visits                                         (Daily | Weekly | Monthly) ┐
│ 1,240 visits · 690 unique in the shown period                                │
│ ▁▂▅▃▇▆▃▂▅▆▇▃ … (last 30 days, full chart, §5.3)                              │
│ ■ Visits  ■ Unique visitors (counted per day)                                │
└──────────────────────────────────────────────────────────────────────────────┘
[RECENT ACTIVITY] group title with dashed rule — last 5 entries (§6.5 rows)   [All activity →]
```

- **Tiles** (Kotoha `.tile`): icon square 40px (`--pink-50`, `--pink-700`, 2px `--pink-100` ring), arrow top-right (`--pink-300`, slides 3px and darkens on hover), label 14px bold, value 34px Lilita `--pink-700` + unit in small text, foot line = **draft pill** or "All published" / "Nothing hidden", **split bar** 7px (published share in `--pink-500`, rest `--gray-100`). Whole tile is a link; hover lifts 3px.
  - Project History: published / drafts (archived excluded) — `projects`.
  - Certifications: shown / hidden(draft), sub line "N certificates · M grade reports" — `certifications` (+ "Grades" title rule, as on About).
  - Tech catalog: total / used by at least one published project — `getToolbox()` (already returns usage).
  - Messages: unread / inbox (unread + read) — `contact_messages`; violet accents.
- **Visitor block** = Kotoha's analytics block, minus the range part (that stays on Statistics): 3 KPI cards with icons (sun, calendar-days, calendar), the full Visits panel with Daily/Weekly/Monthly over **30 days** (`getStats(30)`), legend under the chart, "Full statistics →" link. Skeletons at the final size while loading.
- Kept from v1: "Waiting for you" (Moeko has an inbox and drafts; Kotoha doesn't) and the last-5 activity list.

---

## 5. Statistics (Kotoha's analytics layout, all of Moeko's cards)

Order, top to bottom:

1. Page head: sticker "Statistics", hint pill "Visits to the live site, counted in PH time (weeks start on Monday)". Actions: "Include previews & dev" (segmented-style toggle pill), **Export CSV** (ghost-sm with download icon), "N unread now" lilac chip.
2. **Fixed KPIs** row: Today · This week · This month (icon, label, Lilita value in blue, "N unique" sub).
3. **Visits panel**: h2 with icon + total line ("N visits · M unique in the shown period"), segmented Daily/Weekly/Monthly on the right, chart, legend **under** the chart.
4. **Range bar** (paper strip): `🎚 Details for:` + segmented `7 days · 30 days · 90 days · 1 year` (links keep `?range=` / `?env=`) + hint "N visits in this period". The 365-day info note sits right under it.
5. **Range KPIs** row (Kotoha has 2; we have 3): Avg. visit length · Avg. loading time · Messages in this period (links to Messages). Values 24px green→**pink-700**.
6. **Groups** with Kotoha's group title (text in a paper pill + dashed rule to the right), cards in a 290px-min grid, every card title with an icon:
   - **Audience**: Countries (`map-pin`, lead line "N% from the Philippines") · Devices (`smartphone`) · Browsers & OS (`globe`) · Browser languages (`languages`) · Motion preference (`accessibility`)
   - **Traffic**: Sources (`link`, + campaigns) · Social & e-mail clicks (`mouse-pointer-click`) · Busiest hours, PH time (`clock`, Kotoha hours chart: 24 bars, peak bar dark, note "Busiest: 21:00 · 34 visits")
   - **Engagement**: Pages (`file-text`, avg time) · Home sections (`layers`, "reach % · avg time", hint) · Top projects (`folder-kanban`, wide table with rank badges) · Link clicks by type (`external-link`) · Video plays (`circle-play`, completion note) · Certificates viewed (`award`)
   - **Contact & errors**: Contact funnel (`mail`, 4 steps + conversion) · Not found 404 (`circle-alert`)
7. **Privacy note** on paper with `shield-check`: the existing text ("No cookies… 90 days…").

### 5.1 Bar lists (Kotoha `.bars`)
Row grid `22px · label · value`, the **track on its own line** under label+value (8px, `--gray-100`), fill `--pink-500` (content) or `--blue-500` (visitors), **first row darker** (`--pink-700` / `--blue-700`). Value 13px tabular, `--ink-soft`; extras ("avg 1 min 4 s") in the value text. Empty → small state box.

### 5.2 Range switch feel
Today a range switch shows the full-page skeleton, so the whole page flashes. Kotoha keeps the page and fades only the range-dependent cards to 55% while they load. Same here: the range links become a small client component that navigates inside `useTransition` and dims the range KPIs and groups while pending. No server change.

### 5.3 Visits chart (Kotoha `visitsChart`)
Client component measures its box (`ResizeObserver`, redraw when width changes > 30px) and draws at real pixel width: height 240 (200 under 480px), left pad 40, ticks 11px always, labels every 5 days (7 on phones) counted **from the right edge** so the newest day is always labelled, grid at ½ and max (compact numbers), solid axis at 0. Each column: hover band (`--blue-50`), outer bar `--blue-200`, inner bar `--blue-500` (60% width), active colours darker. **Label above the bar**, clamped to stay inside the box (left 12% / right 88% rule), dark ink with the long date in `--blue-200`. Hover, tap, and keyboard (box is focusable; ←/→ move; focus shows the newest). `<title>` per column kept for screen readers.

---

## 6. Other screens (Kotoha list pattern)

### 6.1 Shared item row (`AdminItem`, new server-compatible component)
`thumb 104×(16:9)` or `icon square 52px` · main (`title` 700, `meta` line: date in `--pink-700` bold tabular + status pill + extras, optional 2-line `text`) · `actions` (ghost-sm buttons, danger-ghost for archive). Drafts: sunken + dashed inset. Hover: lift shadow. Phone: actions wrap under the row; thumb 88px → 72px.

### 6.2 Project History
- Page head: sticker "Project History", hint "Newest first. The newest published project is ‘Latest’ on the home page.", **primary "New project"** button → opens a small MUI dialog (Kotoha dialog style) with the title field → existing `createProject` form action (redirects to the editor as today).
- Toolbar: **segmented filter** `All (13) · Published (12) · Draft (1) · Archived (0)` via `?status=` (counts from the same query).
- Rows: cover thumb (v1 rule: cover, else first gallery image) · title · meta `published 24 Oct 2026` or `last saved 2 days ago` + status pill + lifecycle text (Live / Beta / …) · slug `/history/slug` as text · actions **Edit** · **Publish / Unpublish** · **Archive** (archived rows: **Restore** = back to draft) · **View page ↗** for published.
- Publish/Unpublish/Archive/Restore call the existing `setProjectStatus` from a small client button component; errors (missing alt text, placeholder tagline) appear as an **error toast** with the server's message; success → toast "Saved!" + `router.refresh()`. Archive asks first (confirm dialog, §6.8).

### 6.3 Project editor
Keep v1's sticky bar + jump list; restyle with Kotoha controls: status pill, primary "Save", "Save & publish" (primary) / "Unpublish" (ghost), "Archive" (danger-ghost **with confirm**), "View page ↗". Sections become `panel`s with an icon in the h2 (Basics `file-text`, Media `images`, Links `link`, Tech `shapes`, Description `align-left`, Operations `list-checks`, Credits & SEO `users`). Upload area gets Kotoha's **drop-zone look** (dashed inset 3px `--pink-300`, big upload icon) around the existing `Uploader` (click-to-pick stays; no new drag-and-drop logic). Saved feedback → toast instead of Snackbar.

### 6.4 Certifications
- Page head: sticker, hint (grade-report rule), **primary "Add certification"** → the existing form moves into a **dialog** (same fields, same `Uploader`, same `saveCertification`), like Kotoha's edit dialogs. Edit opens the same dialog filled in.
- Toolbar: segmented `All · Shown · Hidden · Archived` + segmented `Certificates · Grade reports · Both`.
- Rows: certificate image thumb (4:3) · title · meta date + pill · actions **Edit** · **Show/Hide** (status published↔draft via `saveCertification` with the row's current data) · **Archive** (confirm) / **Restore**.

### 6.5 Activity (Kotoha rows)
Icon square chosen **by verb** (create `plus`, save `pencil`, publish `eye`, unpublish `eye-off`, archive `archive`, upload `upload`, delete `trash-2`, login `log-in`, logout `log-out`, failed login `shield-alert` red, password `key-round`) · readable label (v1 map) · meta: **user pill** (username from the existing `admin_users` join) + PH time · details line (the summary). Page hint "Who changed what, and when." Keep "latest 200" (no pagination work).

### 6.6 Archive (new screen, existing data) — see Q3
Kotoha's Archive page, built from what we have: archived **projects** and **certifications** (status = `archived`), newest first, section filter (All · Projects · Certifications), rows with section pill + "archived/last saved" date + **Restore** (projects → draft via `setProjectStatus`; certifications → hidden via `saveCertification`). Messages keep their own Archived/Spam/Trash folders (link from here). Nav: Insights group, No.06 (Messages → No.07, Account → No.08).

### 6.7 Tech catalog
Table → Kotoha rows: icon (the Simple Icon if `iconKey`, else a colour dot, else `shapes`) · name · meta: category pill + "used in N published projects" · link text · **Edit** opens the existing `TechManager` form in a dialog; primary "Add technology" in the head. Same `saveTech`.

### 6.8 Messages
Keep folders, search, bulk actions, keyboard shortcuts. Restyle: folder tabs → segmented pills with counts; rows → Kotoha item look (bubble avatar as the icon square, unread = lilac tint + violet left bar); detail page = paper panel with the meta grid as small lilac cards, action row as Kotoha buttons; **"Delete forever" gets a confirm dialog**.

### 6.9 My Account
Kotoha layout: **account card** (avatar with flower, username, "Owner" pill, "Sign out other devices" ghost button → existing action) · **Change password** panel (`key-round`) · **Statistics** panel (`chart-column`) with the existing "Count my visits" switch. Password rules list in Kotoha style (20px round markers: grey idle, green ✓, red ✕), same rule texts.

### 6.10 Toasts, dialogs, states, skeletons (shared)
- `ToastProvider` (client, in the panel layout) + `useToast()`: bottom-right stack, icon circle, `--success` / `--error` / `--ink`, fade up / fade down, auto-hide 3.5s, `role="status"` / `alert`. Replaces the editor's Snackbar.
- `ConfirmDialog` (MUI Dialog styled like Kotoha: title with a 10×22 pink bar + dashed line under, body, sticky actions row; danger variant). Used for archive, delete forever, sign out other devices.
- `StateBox` restyled: empty = paper 90% + 2px dashed `--pink-200` + 40px flower; small = 1.5px hairline + 22px flower; error = `--error-50`, `--error`, with a "Try again" button that calls `router.refresh()`. Add an `error.tsx` for the panel so a failing query shows this instead of the site-wide error page.
- Skeletons (shimmer, reduced-motion off): KPI 92px, chart 330px, tile 132px, row 76px — dashboard, statistics, and every list page's `loading.tsx`.

---

## 7. Sign-in page (and change password) — Kotoha's card, Moeko's look

```
                 (page: pink-200 + white dots + the two watercolour washes)
        ✿ ← flower-pink 46px, top-left, −18°, sticking out of the card
   ┌──────────────────────────────────────────┐
   │            [Moeko Works logo 210px]        │
   │              [✿ ADMIN SIGN IN] sticker     │
   │  Username                                  │
   │  [______________________________]          │
   │  Password                                  │
   │  [______________________________]          │
   │  ☐ Show password                           │
   │  (! Wrong username or password)  ← red box │
   │  (Waking up the database…)       ← hint    │
   │  [          Sign in          ]  ← primary  │
   │  - - - - - - - - - - - - - - - - - - - -   │
   │  ← View site                     Admin     │
   └──────────────────────────────────────────┘  ✿ ← flower-purple 36px, bottom-right, 22°
```

- Card: `min(420px, 100%)`, padding `30px 26px 22px`, r 32, paper, `--shadow-lift`, fade-up on load (off with reduced motion). The v1 tape strips go (Kotoha uses ornaments, not tape).
- Fields: **labels above** (14px bold), 44px inputs, 2px `--pink-100` border, r 14, hover `--pink-200`, focus `--pink-500` + 4px soft pink glow. Built with plain inputs (or MUI `InputBase` styled the same) — the same names, `autoComplete`, `required`, `autoFocus`, controlled username, show-password checkbox, `useActionState(loginAction)`, the 2.5s "waking up" hint. Error = Kotoha `.form-error` red box with an icon.
- Button: full-width primary (public `.btn` look), "Signing in…" while pending.
- Foot: dashed top line, "← View site" link left, small "Admin" label right (Kotoha has the language switch there; we're English only).
- `method="post"` stays implicit (Server Action), so a password can never land in the URL.
- **Change password** uses the same card: sticker "Set your own password" / "Change password", the intro line, the restyled rules list, "← Back to the dashboard" in the foot.

---

## 8. Files

**New:** `src/components/admin/{AdminItem,Toast,ConfirmDialog,Segmented,KpiCard,StatusButton,AdminDialogForm}.tsx`, `src/app/admin/(panel)/archive/page.tsx` (if Q3 = yes), `src/app/admin/(panel)/error.tsx`, `loading.tsx` for projects, certifications, tech, messages, activity.
**Changed:** `admin.css` (rewritten on Kotoha's structure), `AdminShell.tsx`, `nav.ts`, `AdminPageHead.tsx`, `StateBox.tsx`, `Skeleton.tsx`, `VisitsChart.tsx`, `ActivityList.tsx`, `CertificationManager.tsx`, `TechManager.tsx`, `ProjectEditor.tsx` (markup/classes, toast, confirm), `MessageList.tsx`, `MessageActions.tsx`, `LoginForm.tsx`, `PasswordForm.tsx`, `(panel)/layout.tsx` (pass username/role, toast provider), every `(panel)` page, `login/page.tsx`, `change-password/page.tsx`, `src/lib/admin-format.ts` (verb icons), `docs/plans/ADMIN_UI_PLAN.md` (status → superseded by this file), `docs/plans/PROGRESS.md`.
**Not changed:** everything in §0.1's "not allowed" list.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Inline publish/archive from lists hits the server's publish checks | Show the server's own error in a toast; nothing is bypassed |
| Restyling MUI inputs/dialogs leaks to the public contact form | All admin styles under `.admin-root` / the dialog's `className`; shared theme untouched |
| Strong pink page tires the eye on long editing sessions | Paper panels carry the content; Q1 offers the pale page |
| Dashboard heavier (30-day `getStats` + 4 tile queries) | One existing query set; measure on the dev server; fall back to 7 days if slow |
| Still no local data (`.env.local` has the old DB password) | Same as v1: owner updates `.env.local` or signs in on the branch preview; I also build a **mock preview route in the scratchpad only** (never committed) to check layout at all widths before asking |

---

## 10. Phases & checklist

- [x] **K0** Kyle reads this file, answers §11 (defaults used if not), says "code it"
- [x] **K1** Tokens, page, top bar, sidebar, page head, buttons/segmented/inputs, states, toasts, confirm dialog → screenshots → ✋1
- [x] **K2** Sign-in + change password (§7)
- [x] **K3** Dashboard (§4) + skeletons
- [x] **K4** Statistics (§5) incl. the width-aware chart and pending dimming
- [x] **K5** Lists: Projects (filter + inline actions), Certifications (dialog form, filters), Tech, Activity, Archive, Messages, Account, editor restyle → ✋2 (every screen, desktop + phone)
- [~] **K6** (layout/a11y checks done on a mock; real-data pass = Kyle on production) QA: 1920 / 1366 / 1024 / 768 / 390 px, keyboard-only, reduced motion, contrast; full regression of every flow (sign in, forced change, create → edit → upload → publish → unpublish → archive → restore, certification add/edit/hide/archive/restore, tech add/edit, messages read/star/archive/spam/trash/delete forever/reply, CSV, count-my-visits, sign out others, sign out). `npx tsc --noEmit && npx eslint src && npm run build`
- [x] **K7** Secret scan → commit on `admin-ui-refresh` → push → preview → ✋3 Kyle's OK → merge to `dev` → `main` → production check → `PROGRESS.md`

---

## 11. Questions for Kyle (my recommendation · confidence)

1. **Page colour**: Kotoha's strong page (`--pink-200` + white dots + washes) or the pale public canvas? **Recommend the pink page** — it's most of why Kotoha reads better, and pink-200 is a public brand colour. *Medium-high confidence.*
2. **Statistics on the dashboard**: Kotoha puts *all* statistics on the dashboard. We have 16 cards, so I'd put the fixed KPIs + Visits chart on the dashboard and keep the full breakdown on Statistics (with Kotoha's layout). **Recommend split.** *Medium confidence* — say "all on the dashboard" if you want it exactly like Kotoha.
3. **Archive screen** (§6.6): new page listing archived projects + certifications with Restore, all from existing data/actions. **Recommend yes.** *High confidence.*
4. **Inline actions on lists** (publish/unpublish/archive/restore without opening the editor, with confirms): **Recommend yes** (Kotoha parity). *High confidence.*
5. **Certification form in a dialog** instead of always-open at the top: **Recommend yes** (matches Kotoha, frees the page for the list). *Medium-high confidence.*
6. **Local real-data check**: paste the new connection string into `.env.local` before K1, or review on the branch preview yourself. **Recommend `.env.local`** so I can screenshot every screen with real data. *High confidence.*
