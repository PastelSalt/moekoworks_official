// Kotoha Fan Site seed (plan §21): the project record, live link, tech stack, operations and media.
// Media metadata comes from scripts/capture/out/kotoha/uploads.json (written by the upload step).
//
//   npm run seed:kotoha -- --dry-run      list everything that would be written
//   npm run seed:kotoha                   create the project (refuses if it already exists)
//   npm run seed:kotoha -- --replace      replace its links / tech / operations / media (pre-launch re-runs)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { onAccentOf, strongOf } from "../src/lib/color.ts";
import { db, schema } from "./_db.mts";
import { TECH } from "./seed-tech.mts";

const dry = process.argv.includes("--dry-run");
const replace = process.argv.includes("--replace");
const SLUG = "kotoha-fansite";
const ACCENT = "#FE9FB9";
const ACCENT_2 = "#63A23D";

const project = {
  slug: SLUG,
  title: "Kotoha Fan Site",
  tagline: "A bilingual fan site for VTuber Kotoha with a clover-scrapbook design, stream countdown, discography, credited fan-art gallery and a full admin panel.",
  descriptionMd: [
    "**Kotoha Fan Site** is an unofficial, non-profit fan site for **Kotoha (ことは)**: VTuber with AiceClass, vocalist of the duo HaKoniwalily and support vocalist for HoneyWorks. It gathers everything fans look for in one place, in Japanese and English. It answers when the next stream starts and what's new, and it shows every video, release and achievement alongside a growing gallery of credited fan art.",
    "The v2 design, **“Clover Scrapbook,”** turns the page into a scrapbook. Paper notes are taped onto artwork, die-cut stickers mark the details, and stitched borders highlight featured items, all over an artwork backdrop that crossfades between sections. Every entrance is timed to one tempo (128 BPM) so the motion feels coordinated. A Motion toggle, together with the device's reduced-motion setting, switches the whole site to a calm mode.",
    "Behind the scenes it is a lightweight site with **no build step** (HTML, modern CSS and ES modules), backed by four Vercel Functions on Node.js, Neon Postgres and Cloudinary. A private admin panel lets the owner and invited admins publish videos, news, achievements, releases and fan art, restore anything archived, review an activity log and read cookieless visitor statistics.",
  ].join("\n\n"),
  category: "web",
  platforms: ["web"],
  lifecycle: "live",
  role: "Solo developer: design, front end, back end, admin panel, analytics",
  startedOn: "2026-09-26",
  finishedOn: null,
  credits: [
    { name: "Kotoha · AiceClass", role: "Character and official art" },
    { name: "Fan artists", role: "Fan art, credited on the site" },
  ],
  accentColor: ACCENT,
  accentColor2: ACCENT_2,
  accentStrong: strongOf(ACCENT),
  accentOn: onAccentOf(ACCENT),
  status: "published",
  disclaimerMd:
    "Unofficial, non-profit fan site. Not affiliated with Kotoha, HaKoniwalily, HoneyWorks or AiceClass. Characters and artwork belong to their respective owners; fan art is credited on the site.",
};

const links = [{ kind: "live", label: null, url: "https://kotoha-fansite.vercel.app/", note: "kotoha-fansite.vercel.app", isPrimary: true }];

// [tech slug, usage note]
const stack: [string, string][] = [
  ["html5", "Semantic, accessible markup with no build step."],
  ["css", "Cascade layers, @property, scroll-driven animations and View Transitions."],
  ["javascript", "Native ES modules: no framework and no bundler."],
  ["gsap", "Arrival choreography and SplitText letter pops."],
  ["lenis", "Smooth wheel scrolling and section glides on desktop."],
  ["canvas-confetti", "Clover confetti on special days."],
  ["lucide", "Interface icons."],
  ["animate-css", "Small transitions in the admin panel."],
  ["nodejs", "Four grouped Vercel Functions."],
  ["vercel", "Hosting in Singapore (sin1) with CSP, SRI and HSTS headers."],
  ["neon", "Serverless Postgres over the HTTP driver, with retries."],
  ["postgresql", "Ordered SQL migrations and idempotent seeds."],
  ["cloudinary", "Signed direct uploads and optimised delivery of fan art."],
  ["argon2", "Password hashing for the admin accounts."],
  ["youtube", "Video lookups and privacy-enhanced embeds."],
  ["sharp", "Image-optimisation scripts."],
];

// [audience, title, body, icon]
const operations: [string, string, string, string][] = [
  ["visitor", "Arrive in style", "A loader of at least 3 s showcases one of three artworks while everything preloads. Two clovers spin, the petals fill with real progress, “Did you know?” facts rotate, and an iris opens onto Home.", "sparkles"],
  ["visitor", "Read in your language", "Visitors in Japan get Japanese and everyone else English. A switcher changes everything, including headings, menus, About and the footer.", "languages"],
  ["visitor", "Glide through sections", "On desktop you scroll freely, then the page glides to the next section. Phones scroll freely while the artwork backdrop crossfades.", "layers"],
  ["visitor", "Catch the next stream", "A countdown for the regular Tue & Fri ~21:00 JST streams, this week's schedule, the newest video, the two newest news items and the next release.", "timer"],
  ["visitor", "Get to know Kotoha", "A profile card covers birthday, debut, height, activities, fan name, hashtags and favourites.", "user"],
  ["visitor", "Watch and read everything", "All videos and news, newest first, with a privacy-enhanced YouTube player.", "play"],
  ["visitor", "Explore the discography", "Every release with YouTube-thumbnail covers and a “coming soon” card.", "disc"],
  ["visitor", "Browse fan art", "An infinite masonry gallery whose lightbox grows out of the tapped tile, with the artist and source credited.", "images"],
  ["visitor", "Turn motion off", "The site remembers the choice and always respects the device setting.", "wand"],
  ["visitor", "Celebrate", "Clover confetti on special days.", "party"],
  ["admin", "Sign in safely", "The first login forces a password change, with leak checks (HIBP) and a lockout after repeated failures.", "lock"],
  ["admin", "Publish content", "Paste a YouTube link and the title and thumbnail are looked up. Manage news, achievements and discography with drafts.", "news"],
  ["admin", "Upload fan art", "Signed direct uploads to Cloudinary that shrink files to free-tier limits automatically, with credits.", "cloud-upload"],
  ["admin", "Never lose anything", "Deleting archives an item with the reason, who and when; any item can be restored.", "archive"],
  ["admin", "Manage the team", "The owner creates auto-numbered admin accounts with temporary passwords, resets or removes them. Anyone can sign out their other devices.", "users"],
  ["admin", "Watch the numbers", "A dashboard with content counts, an activity log, and visitor statistics for 7/30/90/365 days (JST).", "chart"],
  ["system", "Cookieless analytics", "Daily-salted visitor hashes and no stored IPs; events batched with `sendBeacon`; 90-day raw data with daily rollups.", "shield-check"],
  ["system", "Locked-down delivery", "A strict Content-Security-Policy with Subresource Integrity on every CDN script, and HSTS.", "shield"],
  ["system", "Resilient database access", "The Neon HTTP driver with connection retries, plus a “waking up” notice while the free compute resumes.", "database"],
  ["system", "Repeatable setup", "Ordered SQL migrations, idempotent seeds, an owner-bootstrap script and image-optimisation scripts.", "workflow"],
];

// [upload key, role, frame, alt, caption]
const media: [string, string, string, string, string | null][] = [
  ["preview", "preview", "browser", "Preview of Kotoha Fan Site: the loader, Home, About, News, Discography, the fan-art lightbox and the Japanese view.", null],
  ["hover", "hover", "browser", "Short preview of Kotoha Fan Site's home page and section glides.", null],
  ["home", "gallery", "browser", "Kotoha Fan Site home page: the Kotoha logo, links, a countdown to the next stream, this week's schedule and the latest news and video.", "Home: next-stream countdown, this week's schedule, the latest news and video."],
  ["about", "gallery", "browser", "About section with Kotoha's profile card: birthday, debut, height, activities, fan mark and favourites.", "About: the profile card."],
  ["news", "gallery", "browser", "News section listing the latest news and videos, with the newest video in a player.", "News: every video and update, newest first."],
  ["discography", "gallery", "browser", "Discography section with release covers, a coming-soon card and the achievements timeline.", "Discography and achievements."],
  ["gallery", "gallery", "browser", "Fan-art gallery in a masonry layout, every tile credited to its artist.", "Gallery: credited fan art in an infinite masonry."],
  ["lightbox", "gallery", "browser", "Lightbox open on a fan-art piece, with the artist credit and a link to the original post.", "The lightbox grows out of the tapped tile."],
  ["japanese", "gallery", "browser", "Home page in Japanese after switching the language.", "Japanese: one switch changes the whole site."],
  ["loader", "gallery", "browser", "Loading screen with a birthday artwork, spinning clovers and a “Did you know?” fact.", "Loader: artwork, spinning clovers and real progress."],
  ["phone-home", "gallery", "phone", "Kotoha Fan Site on a phone: logo, links, stream countdown and weekly schedule.", "On a phone: Home."],
  ["phone-gallery", "gallery", "phone", "Fan-art gallery on a phone in two columns.", "On a phone: the gallery."],
];

type Upload = { public_id: string; version: number; format: string; width: number; height: number; bytes: number; duration?: number; resource_type: string; dominant?: string | null };
const uploads: Record<string, Upload> = JSON.parse(readFileSync(join(import.meta.dirname, "capture", "out", "kotoha", "uploads.json"), "utf8"));
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
  .values({ ...project, publishedAt: new Date() })
  .onConflictDoUpdate({
    target: schema.projects.slug,
    set: { ...project, updatedAt: sql`now()`, publishedAt: sql`coalesce(${schema.projects.publishedAt}, now())` },
  })
  .returning({ id: schema.projects.id });
const projectId = row.id;

await db.batch([
  db.delete(schema.projectOperations).where(eq(schema.projectOperations.projectId, projectId)),
  db.delete(schema.projectLinks).where(eq(schema.projectLinks.projectId, projectId)),
  db.delete(schema.projectTechnologies).where(eq(schema.projectTechnologies.projectId, projectId)),
  db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.projectId, projectId)),
  db.insert(schema.projectLinks).values(links.map((l, i) => ({ ...l, projectId, sortOrder: i }))),
  db.insert(schema.projectTechnologies).values(stack.map(([slug, usageNote], i) => ({ projectId, technologyId: techId.get(slug)!, usageNote, sortOrder: i }))),
  db.insert(schema.projectOperations).values(operations.map(([audience, title, bodyMd, icon], i) => ({ projectId, audience, title, bodyMd, icon, sortOrder: i }))),
  db.insert(schema.mediaAssets).values(
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
  ),
]);

console.log(`✓ ${project.title} seeded (project id ${projectId}). Pages refresh within 10 minutes, or on the next deploy.`);
