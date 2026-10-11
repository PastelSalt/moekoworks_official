// Hanon Fan Site seed (copy of seed-kotoha.mts, see docs/NEW-PROJECT-PLAYBOOK.md §8): project, link, tech,
// operations and media. Media metadata comes from scripts/capture/out/hanon/uploads.json (upload step).
//
//   npm run seed:hanon -- --dry-run      list everything that would be written
//   npm run seed:hanon                   create the project (refuses if it already exists)
//   npm run seed:hanon -- --replace      replace its links / tech / operations / media
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { onAccentOf, strongOf } from "../src/lib/color.ts";
import { db, schema } from "./_db.mts";
import { TECH } from "./seed-tech.mts";

const dry = process.argv.includes("--dry-run");
const replace = process.argv.includes("--replace");
const SLUG = "hanon-fansite";
const ACCENT = "#79B5FF";
const ACCENT_2 = "#FFD66B";

const project = {
  slug: SLUG,
  title: "Hanon Fan Site",
  tagline: "A bilingual fan site for singer and VTuber Hanon, sister to the Kotoha site, with a blue ripple-scrapbook design, stream countdown and credited fan art.",
  descriptionMd: [
    "**Hanon Fan Site** is an unofficial, non-profit fan site for **Hanon (はのん)**: singer and VTuber, one half of the vocal duo HaKoniwalily with Kotoha, vocalist of the music trio StellaPhizz and a guest vocalist for HoneyWorks. Like its sister, the Kotoha Fan Site, it gathers everything fans look for in Japanese and English: when the next stream starts, what's new, every video, release and achievement, and a gallery of credited fan art.",
    "The design, **“Sazanami Scrapbook”** (*sazanami* means ripples), keeps the sister site's scrapbook of paper notes, die-cut stickers and washi tape over crossfading fan art, and recolours it in Hanon's blue with penguin gold. Her penguin mark, ripples, water drops and four-point stars take the place of the clovers, and the loader turns two stars whose rays fill with real progress around a little penguin.",
    "It started from the Kotoha code and was **built light from day one**, applying everything the Kotoha performance pass taught: native scrolling, solid paper instead of blur, one scroll ticker and animations that stop in far-away sections. Behind it are four Vercel Functions on Node.js, Neon Postgres, Cloudinary and the same admin panel, and a headless-Chrome test harness is committed with the code.",
  ].join("\n\n"),
  category: "web",
  platforms: ["web"],
  lifecycle: "live",
  role: "Solo developer: design, front end, back end, admin panel, analytics",
  startedOn: "2026-10-09",
  finishedOn: null,
  credits: [
    { name: "Hanon · AiceClass", role: "Character, official model and name logo" },
    { name: "はなあられ · 鍋公かお", role: "Character design · modeling" },
    { name: "Fan artists", role: "Fan art, credited on the site" },
  ],
  accentColor: ACCENT,
  accentColor2: ACCENT_2,
  accentStrong: strongOf(ACCENT),
  accentOn: onAccentOf(ACCENT),
  status: "published",
  disclaimerMd:
    "Unofficial, non-profit fan site. Not affiliated with Hanon, HaKoniwalily, StellaPhizz, HoneyWorks, MARUMOCHI or AiceClass. Characters and artwork belong to their respective owners; fan art is credited on the site.",
};

const links = [{ kind: "live", label: null, url: "https://hanon-fansite.vercel.app/", note: "hanon-fansite.vercel.app", isPrimary: true }];

// [tech slug, usage note]
const stack: [string, string][] = [
  ["html5", "Semantic, accessible markup with no build step."],
  ["css", "Cascade layers, scroll-driven animations and View Transitions."],
  ["javascript", "Native ES modules: no framework and no bundler."],
  ["gsap", "Arrival choreography and SplitText letter pops."],
  ["canvas-confetti", "Penguin confetti on special days, loaded after the loader."],
  ["lucide", "An inlined icon sprite on the site; the full set in the admin panel."],
  ["nodejs", "Four grouped Vercel Functions, plus the dev and test scripts."],
  ["vercel", "Hosting in Singapore (sin1) with CSP, SRI and HSTS headers."],
  ["neon", "Serverless Postgres over the HTTP driver, with retries."],
  ["postgresql", "Ordered SQL migrations adapted from the sister site, and an idempotent seed."],
  ["pglite", "In-memory Postgres for local previews before the real database existed."],
  ["cloudinary", "Signed direct uploads and optimised delivery of fan art."],
  ["argon2", "Password hashing for the admin accounts."],
  ["youtube", "Video lookups and privacy-enhanced embeds."],
  ["sharp", "Image optimisation: WebP artwork in every size the page asks for."],
];

// [audience, title, body, icon]
const operations: [string, string, string, string][] = [
  ["visitor", "Arrive in style", "A loader of at least 3 s shows one of the artworks while everything preloads. Two four-point stars turn, their rays light up with real progress around a little penguin, “Did you know?” facts rotate, and an iris opens onto Home.", "sparkles"],
  ["visitor", "Read in your language", "Visitors in Japan get Japanese and everyone else English. A switcher changes everything, including headings, menus, About and the footer.", "languages"],
  ["visitor", "Scroll freely", "Native scrolling on every device, never snapped, while the fan-art backdrop crossfades from section to section.", "layers"],
  ["visitor", "Catch the next stream", "A flip-digit countdown to the Monday & Thursday 21:00 JST streams, this week's schedule, the newest video, the two newest news items and the next release.", "timer"],
  ["visitor", "Get to know Hanon", "A profile card covers birthday, debut, height, activities, fan name, hashtags and favourites, next to her full-body model on a ripple stage.", "user"],
  ["visitor", "Watch and read everything", "All videos and news, newest first, with a privacy-enhanced YouTube player and a film strip of every video.", "play"],
  ["visitor", "Explore the discography", "Every release with YouTube-thumbnail covers, a “coming soon” card and an achievements timeline.", "disc"],
  ["visitor", "Browse fan art", "An infinite masonry gallery whose lightbox grows out of the tapped tile, with the artist and source credited.", "images"],
  ["visitor", "Turn motion off", "The site remembers the choice and always respects the device setting.", "wand"],
  ["visitor", "Celebrate", "Penguin confetti on her birthday (March 6) and her debut anniversary (July 9).", "party"],
  ["visitor", "Visit the sister site", "The Hanon and Kotoha fan sites link to each other from their footers.", "heart"],
  ["admin", "Sign in safely", "The first login forces a password change, with leak checks (HIBP) and a lockout after repeated failures.", "lock"],
  ["admin", "Publish content", "Paste a YouTube link and the title and thumbnail are looked up. Manage news, achievements and discography with drafts.", "news"],
  ["admin", "Upload fan art", "Signed direct uploads to Cloudinary that shrink files to free-tier limits automatically, with credits.", "cloud-upload"],
  ["admin", "Never lose anything", "Deleting archives an item with the reason, who and when; any item can be restored.", "archive"],
  ["admin", "Manage the team", "The owner creates auto-numbered admin accounts with temporary passwords, resets or removes them. Anyone can sign out their other devices.", "users"],
  ["admin", "Watch the numbers", "A dashboard with content counts, an activity log, and visitor statistics for 7/30/90/365 days (JST).", "chart"],
  ["system", "Built light from day one", "Every lesson from the Kotoha performance pass applied from the start: native scrolling, solid paper instead of blur, one scroll ticker, a compositor-driven marquee and no animations in far-away sections.", "gauge"],
  ["system", "Tested end to end", "A headless-Chrome harness lives in the repo: section screenshots, a scroll benchmark on the real GPU, a behaviour suite and a 50-check admin smoke test run on a throwaway database copy.", "badge-check"],
  ["system", "Cookieless analytics", "Daily-salted visitor hashes and no stored IPs; events batched with `sendBeacon`; 90-day raw data with daily rollups.", "shield-check"],
  ["system", "Locked-down delivery", "A strict Content-Security-Policy with Subresource Integrity on every CDN script, and HSTS.", "shield"],
  ["system", "Resilient database access", "The Neon HTTP driver with connection retries, plus a “waking up” notice while the free compute resumes.", "database"],
  ["system", "Repeatable setup", "Ordered SQL migrations, an idempotent seed, an owner-bootstrap script, image optimisation and an in-memory database for local previews.", "workflow"],
];

// [upload key, role, frame, alt, caption]
const media: [string, string, string, string, string | null][] = [
  ["preview", "preview", "browser", "Preview of Hanon Fan Site: the loader, Home, About, News, Discography, the fan-art lightbox and the switch to Japanese.", null],
  ["hover", "hover", "browser", "Short preview of Hanon Fan Site's home page and the move to the About section.", null],
  ["home", "gallery", "browser", "Hanon Fan Site home page: the Hanon logo, unit tags and links, a countdown to the next stream, this week's schedule, the fan art of the moment, the latest news and video.", "Home: next-stream countdown, this week's schedule, the latest news and video."],
  ["about", "gallery", "browser", "About section with Hanon's profile card, her biography and hashtags, and her full-body model standing on a ripple stage.", "About: the profile card and a ripple stage."],
  ["news", "gallery", "browser", "News section listing the latest news, with the newest video in a player above a film strip of videos.", "News: every video and update, newest first."],
  ["discography", "gallery", "browser", "Discography section with release covers and the achievements timeline.", "Discography and achievements."],
  ["gallery", "gallery", "browser", "Fan-art gallery in a masonry layout, every tile credited to its artist.", "Gallery: credited fan art in an infinite masonry."],
  ["lightbox", "gallery", "browser", "Lightbox open on a fan-art piece, with the artist credit and a link to the original post.", "The lightbox grows out of the tapped tile."],
  ["japanese", "gallery", "browser", "Home page in Japanese after switching the language.", "Japanese: one switch changes the whole site."],
  ["loader", "gallery", "browser", "Loading screen with a duo artwork, the Hanon logo, two four-point stars and a “Did you know?” fact.", "Loader: artwork, turning stars and real progress."],
  ["phone-home", "gallery", "phone", "Hanon Fan Site on a phone: logo, unit tags, social links, stream countdown, weekly schedule and the fan art of the moment.", "On a phone: Home."],
  ["phone-gallery", "gallery", "phone", "Fan-art gallery on a phone in two columns.", "On a phone: the gallery."],
];

// operation title → screenshot shown in its card (admin shots: none yet)
const opMedia: Record<string, string> = {};

type Upload = { public_id: string; version: number; format: string; width: number; height: number; bytes: number; duration?: number; resource_type: string; dominant?: string | null };
const uploads: Record<string, Upload> = JSON.parse(readFileSync(join(import.meta.dirname, "capture", "out", "hanon", "uploads.json"), "utf8"));
const missing = media.filter(([k]) => !uploads[k]).map(([k]) => k);
if (missing.length) throw new Error(`uploads.json is missing: ${missing.join(", ")}`);
if (project.tagline.length > 160) throw new Error(`tagline is ${project.tagline.length} chars (max 160)`);
const tooLong = operations.filter(([, t]) => t.length > 80);
if (tooLong.length) throw new Error(`operation titles over 80 chars: ${tooLong.map(([, t]) => t).join(", ")}`);
const unknownTech = stack.filter(([s]) => !TECH.some((t) => t.slug === s));
if (unknownTech.length) throw new Error(`run seed:tech first / unknown tech: ${unknownTech.map(([s]) => s).join(", ")}`);

console.log(`Project  ${project.title} (${project.slug}) · accent ${ACCENT} → strong ${project.accentStrong}, on ${project.accentOn}`);
console.log(`Links    ${links.map((l) => `${l.kind} ${l.url}`).join(" · ")}`);
console.log(`Tech     ${stack.length}: ${stack.map(([s]) => s).join(", ")}`);
console.log(`Ops      ${operations.length} (visitor ${operations.filter((o) => o[0] === "visitor").length}, admin ${operations.filter((o) => o[0] === "admin").length}, system ${operations.filter((o) => o[0] === "system").length})`);
console.log(`Media    ${media.length}: ${media.map(([k, r]) => `${k}:${r}`).join(", ")}`);
if (dry) {
  console.log("(dry run: nothing written)");
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
