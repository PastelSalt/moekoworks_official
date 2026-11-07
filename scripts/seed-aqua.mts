// Aqua Iro Archive seed (copy of seed-himawari.mts, see docs/NEW-PROJECT-PLAYBOOK.md §8): project, link, tech,
// operations and media. Media metadata comes from scripts/capture/out/aqua/uploads.json (upload step).
// Facts from the local repo (README, src/content, src/components, src/server) and the live site, 2026-10-24.
//
//   npm run seed:aqua -- --dry-run      list everything that would be written
//   npm run seed:aqua                   create the project (refuses if it already exists)
//   npm run seed:aqua -- --replace      replace its links / tech / operations / media
//   npm run seed:aqua -- --sql <file>   write the whole seed (incl. the tech catalog) as SQL statements instead
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { onAccentOf, strongOf } from "../src/lib/color.ts";
import { db, schema } from "./_db.mts";
import { TECH } from "./seed-tech.mts";

const dry = process.argv.includes("--dry-run");
const replace = process.argv.includes("--replace");
const SLUG = "aqua-iro-archive";
const ACCENT = "#F2A7CF"; // the archive's --aqua-pink
const ACCENT_2 = "#7FD9F2"; // its --aqua-cyan

const project = {
  slug: SLUG,
  title: "Aqua Iro Archive",
  tagline: "A bilingual fan archive of Minato Aqua's six years (2018–2024), built like a visual novel: talk with her, travel through time and leave her a note.",
  descriptionMd: [
    "**Aqua Iro Archive** (あくあ色アーカイブ) is an unofficial, non-profit fan archive of **Minato Aqua**, the hololive VTuber who streamed from her debut on 8 August 2018 to her graduation on 28 August 2024. It gathers six years in eight chapters, in Japanese and English: her profile, the clips fans kept, a discography of 19 originals and many covers, all 639 archived streams, the voyage from debut to graduation, 190 pieces of official art, and a message board where fans leave her a note.",
    "The design treats the site as **a harbour where Aqua's colours are the sea**: a pastel seigaiha wash, paper notes taped on top, and a navy deep with a pink-and-cyan crest that rises as a shutter between chapters. It plays like a visual novel: a loading screen with a tide gauge and a PRESS START title, a dialogue box where fan-written lines let you talk with her, a log with a backlog and a memory album, and **Aqua Time**, a tape deck that rewinds the whole archive to any day of her career.",
    "It's built with Astro (static first) and Preact islands in plain CSS, with Neon Postgres and Drizzle behind the moderated message board, Better Auth with forced two-factor sign-in for the keeper's panel, Cloudflare Turnstile against spam and its own cookieless visitor counting (a visitor hash that changes every day, IP addresses never stored), all on Vercel. The code is open source on GitHub. Pages are checked for a JavaScript budget and WCAG contrast, and the board's pipeline is tested against the real migrations.",
  ].join("\n\n"),
  category: "web",
  platforms: ["web"],
  lifecycle: "live",
  role: "Solo developer: design, front end, back end, moderation and keeper panel, content curation",
  startedOn: "2026-10-12",
  finishedOn: null,
  credits: [
    { name: "Minato Aqua · hololive production (COVER Corp.)", role: "Character, official art, model and songs" },
    { name: "Gaou", role: "Character design and illustration, credited on the site" },
    { name: "Fan clippers and artists", role: "Clips and works, credited on the site" },
  ],
  accentColor: ACCENT,
  accentColor2: ACCENT_2,
  accentStrong: strongOf(ACCENT),
  accentOn: onAccentOf(ACCENT),
  status: "published",
  disclaimerMd:
    "Unofficial, non-profit fan site. Not affiliated with COVER Corp. or hololive production. Characters, art and songs belong to their respective owners and are credited on the site; Aqua's lines in Talk with Aqua are fan-written, not her actual words.",
};

const links = [
  { kind: "live", label: null, url: "https://aqua-iro-archive.vercel.app/", note: "aqua-iro-archive.vercel.app", isPrimary: true },
  { kind: "other", label: "Source code", url: "https://github.com/PastelSalt/aqua-iro-archive", note: "On GitHub · MIT for the code", isPrimary: false },
];

// [tech slug, usage note]
const stack: [string, string][] = [
  ["astro", "Static-first pages for eight chapters in Japanese and English, with page-switch transitions."],
  ["preact", "Islands for the dock, the Talk box, Aqua Time, the LOG and HELP drawers and the message board."],
  ["typescript", "The whole code base, from content schemas to the board's server pipeline."],
  ["css", "Plain CSS on tokens: the seigaiha wash, paper notes, the deep's wave seams and the shutter."],
  ["gsap", "The rope of the Events voyage, driven by ScrollTrigger."],
  ["uplot", "The streaming charts: streams per year and the archive's records."],
  ["fusejs", "Fuzzy search across all 639 streams."],
  ["budoux", "Natural Japanese line breaks in headings and dialogue."],
  ["youtube", "Privacy-enhanced clip and stream embeds, and the BGM player that never autoplays."],
  ["neon", "Serverless Postgres for the message board, moderation, settings and the site's own visitor statistics."],
  ["drizzle", "Schema, migrations and seeds for the board."],
  ["better-auth", "The keeper's sign-in, with two-factor (TOTP) required."],
  ["turnstile", "Spam protection on new notes, without tracking visitors."],
  ["discord", "Alerts for reports and held notes, carrying the crew number but never the note text."],
  ["vercel", "Hosting in Singapore (sin1) with a strict, hash-based Content-Security-Policy."],
  ["sharp", "Curated WebP art in every size the pages ask for."],
  ["pglite", "In-process Postgres so the board's integration tests run on the real migrations anywhere."],
  ["vitest", "Unit, data and integration tests, including the Talk scripts and the stream data."],
  ["playwright", "End-to-end tests with axe on the built site, served with the production headers."],
  ["github-actions", "CI on every push, and a weekly encrypted database backup."],
];

// [audience, title, body, icon]
const operations: [string, string, string, string][] = [
  ["visitor", "Set sail from the title screen", "A loading screen with her under-the-sea key visual and a tide gauge, then a title screen with just her, the logo and PRESS START. It shows once per session.", "sparkles"],
  ["visitor", "Talk with Aqua", "A visual-novel dialogue box on Home: choose replies and she answers with fan-written lines, with SKIP, AUTO and a LOG of the conversation.", "heart"],
  ["visitor", "Rewind to any day", "Aqua Time is a tape deck: scrub to any day from her debut to her graduation and the whole archive shows that day, from her outfit to the stream log. “On this day” lists what happened on today's date.", "clock"],
  ["visitor", "Read her story", "Her profile, lore and relationships, then the voyage from debut to graduation along a rope of 60 milestones.", "user"],
  ["visitor", "Browse every stream", "All 639 archived streams with filters, fuzzy search and charts of her streaming years.", "search"],
  ["visitor", "Listen to her songs", "19 originals plus solo and collab covers, and a BGM capsule that keeps playing her official uploads between chapters.", "disc"],
  ["visitor", "Revisit the clips and art", "30 fan-favourite clips and 190 pieces of official art, each credited, with bilingual alt text.", "images"],
  ["visitor", "Leave her a note", "The message board gives every note a crew number, previews it, and lets you undo it for a short while.", "news"],
  ["visitor", "Collect memories", "The LOG drawer keeps your conversation backlog and a memory album; a first-visit tour and a HELP drawer show the way.", "archive"],
  ["visitor", "Read it your way", "Japanese or English with one switch, and a Motion OFF that stops every animation.", "languages"],
  ["admin", "Keeper sign-in", "The keeper's panel uses Better Auth with two-factor sign-in required; sign-up is disabled.", "lock"],
  ["admin", "Moderate the board", "Notes are filtered for abuse, reported notes go under review, and held ones wait for the keeper. Alerts reach Discord without the note text.", "shield-check"],
  ["admin", "See what's happening", "A dashboard, visitor statistics and archive insights (what people play, open and search), all counted by the site itself, plus an audit log and an error log.", "chart"],
  ["system", "Static first", "Every chapter is a static page; only small Preact islands load JavaScript, within a per-page budget.", "gauge"],
  ["system", "Locked-down delivery", "A strict Content-Security-Policy with hashes for every inline script, computed at build time.", "shield"],
  ["system", "Privacy by design", "Cookieless first-party statistics with a visitor hash that changes every day, hashed IPs on the board, Turnstile instead of tracking, and YouTube only through its privacy-enhanced player.", "key"],
  ["system", "Tested end to end", "Unit, data and integration tests on PGlite with the real migrations, Playwright with axe on the built site, and a visual diff against the live site.", "badge-check"],
  ["system", "Backed up weekly", "A GitHub Actions workflow dumps the database every week and encrypts it with age before storing it.", "database"],
];

// [upload key, role, frame, alt, caption]
const media: [string, string, string, string, string | null][] = [
  ["preview", "preview", "browser", "Preview of Aqua Iro Archive: the loading screen and PRESS START title, Home with the Talk box, About, the chapter shutters for Discography, Streaming, Events and Arts, and the Message Board.", null],
  ["hover", "hover", "browser", "Short preview of Aqua Iro Archive's navy page-switch shutters opening onto the Discography and Streaming chapters.", null],
  ["title", "gallery", "browser", "Aqua Iro Archive's title screen: Minato Aqua's key visual with the logo and PRESS START on the navy deep.", "The title screen: PRESS START to set sail."],
  ["home", "gallery", "browser", "Home: the archive title, her full-body art in a bubble circle, the Talk with Aqua dialogue box, Three Moments cards, an “On this day” card and the chapter dock.", "Home: talk with her, and “On this day”."],
  ["about", "gallery", "browser", "About chapter banner with her profile introduction and full-body art.", "No.01 About."],
  ["clips", "gallery", "browser", "Clips chapter banner with fan-favourite clip thumbnails taped to the page.", "No.02 Clips."],
  ["discography", "gallery", "browser", "Discography chapter banner with a jacket of her original song and a vinyl record.", "No.03 Discography."],
  ["streaming", "gallery", "browser", "Streaming chapter banner with a chart of streams per year.", "No.04 Streaming: all 639 streams."],
  ["events", "gallery", "browser", "Events chapter banner with a photo of a hololive live stage.", "No.05 Events."],
  ["arts", "gallery", "browser", "Arts chapter banner with three pinned pieces of official art.", "No.06 Arts: 190 credited pieces."],
  ["messages", "gallery", "browser", "Message Board chapter banner: 寄せ書き, one note at a time, for Akutan.", "No.07 Message Board."],
  ["phone-home", "gallery", "phone", "Aqua Iro Archive on a phone: the title, the debut and graduation dates, her art in the bubble circle and the bottom dock.", "On a phone: Home."],
  ["phone-arts", "gallery", "phone", "The Arts chapter on a phone with pinned art and the credit note.", "On a phone: Arts."],
];

// operation title → screenshot shown in its card (also in the gallery)
const opMedia: Record<string, string> = {
  "Set sail from the title screen": "title",
  "Talk with Aqua": "home",
  "Browse every stream": "streaming",
};

type Upload = { public_id: string; version: number; format: string; width: number; height: number; bytes: number; duration?: number; resource_type: string; dominant?: string | null };
const uploads: Record<string, Upload> = JSON.parse(readFileSync(join(import.meta.dirname, "capture", "out", "aqua", "uploads.json"), "utf8"));
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
