// Himawari seed (copy of seed-hanon.mts, see docs/NEW-PROJECT-PLAYBOOK.md §8): project, links, tech,
// operations and media. Media metadata comes from scripts/capture/out/himawari/uploads.json (upload step).
// Owner's exception (2026-10-23): Himawari is open source, so this project links its GitHub repo and releases.
//
//   npm run seed:himawari -- --dry-run      list everything that would be written
//   npm run seed:himawari                   create the project (refuses if it already exists)
//   npm run seed:himawari -- --replace      replace its links / tech / operations / media
//   npm run seed:himawari -- --sql <file>   write the whole seed (incl. the tech catalog) as SQL statements instead
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { onAccentOf, strongOf } from "../src/lib/color.ts";
import { db, schema } from "./_db.mts";
import { TECH } from "./seed-tech.mts";

const dry = process.argv.includes("--dry-run");
const replace = process.argv.includes("--replace");
const SLUG = "himawari";
const ACCENT = "#F5D57C"; // the website's --sun
const ACCENT_2 = "#9CCF7D"; // its --game-grass

const project = {
  slug: SLUG,
  title: "Himawari Visual Novel Studio and Engine",
  tagline: "A free visual novel maker for Windows: write in Himawari Studio, watch the game play as you type, and export a native game of about 3 MB.",
  descriptionMd: [
    "**Himawari** is a free, open-source visual novel engine and editor for Windows, built around three promises: **easy enough for anyone**, **open enough for coders** and **light enough for any PC**. In **Himawari Studio** you write a story as a screenplay, with buttons, pickers and forms instead of code, while the real game plays beside the editor and updates in under a second. One button exports a game that starts with a double-click on any Windows 10 or 11 PC.",
    "Under the hood, the same project is plain text in a small script language. One TypeScript compiler, `@himawari/core`, checks it and turns it into compact bytecode for Studio, the `hwc` command-line tool and the AI tools alike, and a **game engine written in C11 on SDL 3** plays it: about 3 MB, statically linked, with saves, rollback, translations and accessibility built in. AI help is optional and off by default; it drafts, proofreads and translates text, and it never makes images, music, voices or video.",
    "Its **website**, in English and Japanese, carries the download, the tutorial and documentation, and the news. It is static Astro with no cookies and no third-party requests, reads the latest release at build time, and has a small admin panel for the news and cookieless visit statistics. Version 0.4.1 is an early public build; testing with writers and the 1.0 launch come next.",
  ].join("\n\n"),
  category: "desktop",
  platforms: ["windows", "web"],
  lifecycle: "beta",
  role: "Solo developer: design, C game engine, compiler, editor app, AI tools, website and admin panel",
  startedOn: "2026-10-15",
  finishedOn: null,
  credits: [],
  accentColor: ACCENT,
  accentColor2: ACCENT_2,
  accentStrong: strongOf(ACCENT),
  accentOn: onAccentOf(ACCENT),
  status: "published",
  disclaimerMd:
    "Free and open source: the game engine inside every game is zlib-licensed, the tools and Studio are MIT, and the specifications are CC BY 4.0. The Himawari and Moeko Works names and logos are not covered by an open license.",
};

const links = [
  { kind: "live", label: null, url: "https://himawari-moekoworks.vercel.app/", note: "himawari-moekoworks.vercel.app", isPrimary: true },
  { kind: "exe", label: null, url: "https://github.com/PastelSalt/himawari-c/releases/latest", note: "Latest release · Windows 10 or 11, 64-bit", isPrimary: false },
  { kind: "docs", label: null, url: "https://himawari-moekoworks.vercel.app/docs", note: "Tutorial, how-to guides and reference", isPrimary: false },
  { kind: "other", label: "Source code", url: "https://github.com/PastelSalt/himawari-c", note: "On GitHub · zlib and MIT", isPrimary: false },
];

// [tech slug, usage note]
const stack: [string, string][] = [
  ["c", "The game engine: C11, statically linked, about 3 MB, with no DLLs beyond Windows' own."],
  ["sdl", "Windows, input, audio and the GPU renderer (Direct3D 12 or Vulkan) for the engine."],
  ["freetype", "Text rendering, with libunibreak line breaking for English and Japanese."],
  ["typescript", "The compiler and checker, the command-line tool, the AI tools and Studio."],
  ["nodejs", "Runs the compiler and the tools; hwc also ships as a standalone .exe."],
  ["electron", "Himawari Studio, the editor, with the real game docked in its preview pane."],
  ["react", "Studio's interface: the Screenplay view, the story graph, forms and the UI Designer."],
  ["codemirror", "The Script view, with completion and checks from the shared compiler."],
  ["vite", "Builds Studio's interface."],
  ["mcp", "himawari-mcp: 25 tools that let Claude read, write, check and playtest a project."],
  ["claude", "The optional built-in assistant, on the writer's own API key. Never images, music or voices."],
  ["zod", "Validates the input and output of every AI tool."],
  ["cmake", "Builds the engine with Ninja and MSYS2 GCC, and Clang for sanitizers and fuzzing."],
  ["pnpm", "The workspace of TypeScript packages."],
  ["vitest", "More than 500 unit and property tests across the packages and the website."],
  ["playwright", "Drives the real Studio app and every page of the website, with axe accessibility scans."],
  ["github-actions", "Builds and tests everything on Windows for every push, including seven fuzz targets."],
  ["astro", "The website: static pages in English and Japanese, with docs copied from each release."],
  ["preact", "The website's few interactive islands."],
  ["neon", "The website's news and cookieless visit counts."],
  ["drizzle", "The website's schema and migrations."],
  ["argon2", "Password hashing for the website's admin panel."],
  ["vercel", "Hosts the website in Singapore (sin1) behind a strict Content-Security-Policy."],
];

// [audience, title, body, icon]
const operations: [string, string, string, string][] = [
  ["visitor", "Write without code", "Each line of the story is a row: pick who speaks and how they look, then type what they say. Backgrounds, music, choices and conditions come from menus and forms, written in plain words.", "click"],
  ["visitor", "Watch it play as you type", "The real game runs beside the editor and shows every edit in under a second. Press play on any line to start the game right there.", "play"],
  ["visitor", "See the whole story", "The story graph puts every scene and route on one map: link scenes by dragging, see what a playtest covered and spot endings no one can reach.", "workflow"],
  ["visitor", "Design the menus", "The UI Designer moves, resizes and recolours the textbox, choices and every menu on the running game, from seven presets, with a contrast check.", "palette"],
  ["visitor", "Bring in the art", "Layered character sprites with automatic blinking and lip-flap, Photoshop import, and labelled placeholders so the story plays before any art exists.", "images"],
  ["visitor", "Translate it", "Add a language when you need one: every line gets a slot in a translation table, with CSV or XLIFF for other tools, and proper Japanese line breaking and furigana.", "languages"],
  ["visitor", "Never lose work", "Autosave, a history of every change, deletes that go to the Recycle Bin, and recovery after a crash or a power cut.", "refresh"],
  ["visitor", "Export a tiny game", "One button makes a folder or a single .exe with the game's name and icon: about 3 MB before art and music, with saves, rollback, a backlog and accessibility settings built in.", "zap"],
  ["visitor", "Code, if you like", "Projects are plain-text .hws scenes that diff cleanly in git, with the hwc command-line tool, macros, and new statements written in C.", "code"],
  ["visitor", "AI help, only if you want it", "Off until you turn it on. The assistant drafts, proofreads, checks continuity and translates; Claude Code can work through himawari-mcp. Every change is a proposal you accept.", "sparkles"],
  ["visitor", "Get started on the website", "The website, in English and Japanese, has the download with its SHA-256, a guided first game, how-to guides and the news.", "globe"],
  ["admin", "Write the news", "News in English and Japanese from the website's admin panel. Publishing rebuilds the static site through a deploy hook, live in about two minutes.", "news"],
  ["admin", "Sign in safely", "Argon2id passwords checked against known breaches, a lockout after five wrong tries, sessions that end after two idle hours, and a log of everything done.", "lock"],
  ["admin", "Watch the numbers", "Visit statistics in the admin panel, from a counter that sets no cookies.", "chart"],
  ["system", "One compiler for everything", "Studio, hwc and the AI tools share one compiler and checker, so they always agree. The engine never parses text: it plays compact, versioned bytecode.", "layers"],
  ["system", "Light enough for any PC", "The release build is about 2.6 MB with a hard 4 MB limit in CI, stays under 150 MB of memory, and falls back to software rendering without a graphics driver.", "gauge"],
  ["system", "Broken on purpose", "Seven fuzz targets, AddressSanitizer and UndefinedBehaviorSanitizer runs, golden images and a break-it campaign: 14 bugs found, 13 fixed, each with a test.", "shield-check"],
  ["system", "Tested like a product", "A conformance suite where each case must compile to exact bytes in TypeScript and play to an exact transcript in C, end-to-end tests of Studio, and a generated 36,000-line game.", "badge-check"],
  ["system", "A website without trackers", "Static pages with no cookies and no third-party requests, hashed inline scripts in the CSP, under 40 KB of JavaScript per page, and a WCAG contrast check.", "shield"],
  ["system", "Always the latest release", "Each website build reads the newest release: version, date, installer size, SHA-256 and screenshots, and copies its documentation.", "cloud"],
];

// [upload key, role, frame, alt, caption]
const media: [string, string, string, string, string | null][] = [
  ["preview", "preview", "browser", "Preview of the Himawari website: the hero where a line is typed and the docked game answers, About, Features, Download, Learn, News and the Japanese home page.", null],
  ["hover", "hover", "browser", "Short preview of the Himawari website's feature rows, with screenshots of Himawari Studio sliding past.", null],
  ["studio", "gallery", "window", "Himawari Studio with the Sunflower Days sample open: scenes and characters on the left, the story as a screenplay in the middle and the game playing on the right.", "Himawari Studio: the screenplay beside the running game."],
  ["ui-designer", "gallery", "window", "The UI Designer: presets and colour palettes on the left, the textbox being resized on a preview canvas, and the running game on the right.", "The UI Designer, on the running game."],
  ["studio-dark", "gallery", "window", "Himawari Studio in its dark theme with the same scene open.", "Studio's dark theme."],
  ["welcome", "gallery", "window", "Himawari Studio's welcome screen, with buttons to open the tutorial project, start a new project or open an existing one.", "Welcome: the tutorial is one click away."],
  ["home", "gallery", "browser", "Himawari website home page: “Write your story and play it as you type.”, the Download for Windows button with version, date and size, and an editor mockup with the game beside it.", "Website: the hero."],
  ["features", "gallery", "browser", "Website features section: the Screenplay screenshot for writers and the UI Designer for artists.", "Website: features for writers and artists."],
  ["download", "gallery", "browser", "Website download section with the installer button, the requirements table and the SmartScreen note.", "Website: download and requirements."],
  ["about", "gallery", "browser", "Website About section with three cards: easy enough for anyone, open enough for coders, light enough for any PC.", "Website: the three promises."],
  ["learn", "gallery", "browser", "Website Learn section linking the first-game tutorial, the documentation, working with AI, the script language and the source.", "Website: where to learn."],
  ["docs", "gallery", "browser", "Documentation page “Make your first game” with the docs navigation on the left.", "Website: the first-game tutorial."],
  ["japanese", "gallery", "browser", "The Japanese home page of the Himawari website.", "Website: in Japanese."],
  ["phone-home", "gallery", "phone", "Himawari website on a phone: the news bar, the hero and the Download for Windows button.", "On a phone: home."],
  ["phone-features", "gallery", "phone", "Himawari website features on a phone, with the Screenplay screenshot in a window frame.", "On a phone: features."],
];

// operation title → screenshot shown in its card (also in the gallery)
const opMedia: Record<string, string> = {
  "Write without code": "studio",
  "Design the menus": "ui-designer",
  "Get started on the website": "download",
};

type Upload = { public_id: string; version: number; format: string; width: number; height: number; bytes: number; duration?: number; resource_type: string; dominant?: string | null };
const uploads: Record<string, Upload> = JSON.parse(readFileSync(join(import.meta.dirname, "capture", "out", "himawari", "uploads.json"), "utf8"));
const missing = media.filter(([k]) => !uploads[k]).map(([k]) => k);
if (missing.length) throw new Error(`uploads.json is missing: ${missing.join(", ")}`);
if (project.tagline.length > 160) throw new Error(`tagline is ${project.tagline.length} chars (max 160)`);
if (project.title.length > 80) throw new Error(`title is ${project.title.length} chars (max 80)`);
const tooLong = operations.filter(([, t]) => t.length > 80);
if (tooLong.length) throw new Error(`operation titles over 80 chars: ${tooLong.map(([, t]) => t).join(", ")}`);
const unknownTech = stack.filter(([s]) => !TECH.some((t) => t.slug === s));
if (unknownTech.length) throw new Error(`run seed:tech first / unknown tech: ${unknownTech.map(([s]) => s).join(", ")}`);

console.log(`Project  ${project.title} (${project.slug}) · accent ${ACCENT} → strong ${project.accentStrong}, on ${project.accentOn}`);
console.log(`Tagline  ${project.tagline.length} chars`);
console.log(`Links    ${links.map((l) => `${l.kind} ${l.url}`).join(" · ")}`);
console.log(`Tech     ${stack.length}: ${stack.map(([s]) => s).join(", ")}`);
console.log(`Ops      ${operations.length} (visitor ${operations.filter((o) => o[0] === "visitor").length}, admin ${operations.filter((o) => o[0] === "admin").length}, system ${operations.filter((o) => o[0] === "system").length})`);
console.log(`Media    ${media.length}: ${media.map(([k, r]) => `${k}:${r}`).join(", ")}`);
if (dry) {
  console.log("(dry run: nothing written)");
  process.exit(0);
}

// --sql <file>: write the same seed as one SQL transaction (JSON array of statements) instead of connecting.
// For when the local DATABASE_URL can't log in: run the statements with the Neon MCP `run_sql_transaction`.
const sqlOut = process.argv[process.argv.indexOf("--sql") + 1];
if (process.argv.includes("--sql") && sqlOut) {
  const q = (v: unknown): string =>
    v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : typeof v === "boolean" ? String(v) : `'${String(v).replaceAll("'", "''")}'`;
  const pid = `(select id from projects where slug = ${q(SLUG)})`;
  const p = project;
  const statements = [
    `insert into technologies (slug, name, category, icon_key, color, url) values ${TECH.map((t) => `(${[t.slug, t.name, t.category, t.iconKey, t.color, t.url].map(q).join(", ")})`).join(", ")}
     on conflict (slug) do update set name = excluded.name, category = excluded.category, icon_key = excluded.icon_key, color = excluded.color, url = excluded.url`,
    `insert into projects (slug, title, tagline, description_md, category, platforms, lifecycle, role, started_on, finished_on, credits, accent_color, accent_color_2, accent_strong, accent_on, status, disclaimer_md, published_at)
     values (${[p.slug, p.title, p.tagline, p.descriptionMd, p.category].map(q).join(", ")}, array[${p.platforms.map(q).join(", ")}]::text[], ${[p.lifecycle, p.role, p.startedOn, p.finishedOn].map(q).join(", ")}, ${q(JSON.stringify(p.credits))}::jsonb, ${[p.accentColor, p.accentColor2, p.accentStrong, p.accentOn, p.status, p.disclaimerMd].map(q).join(", ")}, ${p.status === "published" ? "now()" : "null"})
     on conflict (slug) do update set title = excluded.title, tagline = excluded.tagline, description_md = excluded.description_md, category = excluded.category, platforms = excluded.platforms, lifecycle = excluded.lifecycle, role = excluded.role, started_on = excluded.started_on, finished_on = excluded.finished_on, credits = excluded.credits, accent_color = excluded.accent_color, accent_color_2 = excluded.accent_color_2, accent_strong = excluded.accent_strong, accent_on = excluded.accent_on, status = excluded.status, disclaimer_md = excluded.disclaimer_md, updated_at = now(), published_at = coalesce(projects.published_at, excluded.published_at)`,
    `delete from project_operations where project_id = ${pid}`,
    `delete from project_links where project_id = ${pid}`,
    `delete from project_technologies where project_id = ${pid}`,
    `delete from media_assets where project_id = ${pid}`,
    `insert into project_links (project_id, kind, label, url, note, is_primary, sort_order) values ${links.map((l, i) => `(${pid}, ${[l.kind, l.label, l.url, l.note, l.isPrimary, i].map(q).join(", ")})`).join(", ")}`,
    `insert into project_technologies (project_id, technology_id, usage_note, sort_order) values ${stack.map(([slug, note], i) => `(${pid}, (select id from technologies where slug = ${q(slug)}), ${q(note)}, ${i})`).join(", ")}`,
    `insert into media_assets (project_id, kind, role, public_id, version, format, width, height, bytes, duration_ms, frame, alt_text, caption, dominant_color, sort_order) values ${media
      .map(([key, role, frame, alt, caption], i) => {
        const u = uploads[key];
        return `(${pid}, ${[u.resource_type === "video" ? "video" : "image", role, u.public_id, u.version, u.format, u.width, u.height, u.bytes, u.duration ? Math.round(u.duration * 1000) : null, frame, alt, caption, u.dominant ?? null, i].map(q).join(", ")})`;
      })
      .join(", ")}`,
    `insert into project_operations (project_id, audience, title, body_md, icon, sort_order, media_id) values ${operations
      .map(([audience, title, body, icon], i) => `(${pid}, ${[audience, title, body, icon, i].map(q).join(", ")}, ${opMedia[title] ? `(select id from media_assets where public_id = ${q(uploads[opMedia[title]].public_id)})` : "null"})`)
      .join(", ")}`,
  ];
  writeFileSync(sqlOut, JSON.stringify(statements, null, 1));
  console.log(`${statements.length} statements → ${sqlOut} (nothing written to the database)`);
  process.exit(0);
}

const [existing] = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.slug, SLUG)).limit(1);
if (existing && !replace) {
  console.error(`"${SLUG}" already exists (id ${existing.id}). Re-run with --replace to rewrite its links, tech, operations and media.`);
  process.exit(1);
}

const techRows = await db.select({ id: schema.technologies.id, slug: schema.technologies.slug }).from(schema.technologies).where(inArray(schema.technologies.slug, stack.map(([s]) => s)));
const techId = new Map(techRows.map((t) => [t.slug, t.id]));
if (techId.size !== stack.length) throw new Error("some technologies are missing in the database: run `npm run seed:tech` first");

const [row] = await db
  .insert(schema.projects)
  // drafts get no publish date: it is set when Kyle publishes (Latest = newest publish date)
  .values({ ...project, publishedAt: project.status === "published" ? new Date() : null })
  .onConflictDoUpdate({
    target: schema.projects.slug,
    set: { ...project, updatedAt: sql`now()`, publishedAt: sql`coalesce(${schema.projects.publishedAt}, now())` },
  })
  .returning({ id: schema.projects.id });
const projectId = row.id;

const [, , , , , , mediaRows] = await db.batch([
  db.delete(schema.projectOperations).where(eq(schema.projectOperations.projectId, projectId)),
  db.delete(schema.projectLinks).where(eq(schema.projectLinks.projectId, projectId)),
  db.delete(schema.projectTechnologies).where(eq(schema.projectTechnologies.projectId, projectId)),
  db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.projectId, projectId)),
  db.insert(schema.projectLinks).values(links.map((l, i) => ({ ...l, projectId, sortOrder: i }))),
  db.insert(schema.projectTechnologies).values(stack.map(([slug, usageNote], i) => ({ projectId, technologyId: techId.get(slug)!, usageNote, sortOrder: i }))),
  db
    .insert(schema.mediaAssets)
    .values(
      media.map(([key, role, frame, altText, caption], i) => {
        const u = uploads[key];
        return {
          projectId,
          kind: u.resource_type === "video" ? "video" : "image",
          role,
          publicId: u.public_id,
          version: u.version,
          format: u.format,
          width: u.width,
          height: u.height,
          bytes: u.bytes,
          durationMs: u.duration ? Math.round(u.duration * 1000) : null,
          frame,
          altText,
          caption,
          dominantColor: u.dominant ?? null,
          sortOrder: i,
        };
      }),
    )
    .returning({ id: schema.mediaAssets.id, publicId: schema.mediaAssets.publicId }),
]);
const idByKey = new Map(media.map(([key]) => [key, mediaRows.find((r) => r.publicId === uploads[key].public_id)?.id ?? null]));
await db.insert(schema.projectOperations).values(
  operations.map(([audience, title, bodyMd, icon], i) => ({ projectId, audience, title, bodyMd, icon, sortOrder: i, mediaId: opMedia[title] ? (idByKey.get(opMedia[title]) ?? null) : null })),
);

console.log(`✓ ${project.title} seeded (project id ${projectId}). Pages refresh within 10 minutes, or on the next deploy.`);
