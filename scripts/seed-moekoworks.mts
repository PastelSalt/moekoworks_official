// Moeko Works Portfolio seed: this site as a project (copy of seed-hanon.mts, docs/NEW-PROJECT-PLAYBOOK.md §8). No
// "For admins" operations or admin screenshots (owner). Dated 2026-01-20 (start and publish date).
// Media metadata comes from scripts/capture/out/moekoworks/uploads.json (upload step).
//
//   npm run seed:moekoworks -- --dry-run      list everything that would be written
//   npm run seed:moekoworks                   create the project (refuses if it already exists)
//   npm run seed:moekoworks -- --replace      replace its links / tech / operations / media
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { onAccentOf, strongOf } from "../src/lib/color.ts";
import { db, schema } from "./_db.mts";
import { TECH } from "./seed-tech.mts";

const dry = process.argv.includes("--dry-run");
const replace = process.argv.includes("--replace");
const SLUG = "moekoworks-portfolio";
const ACCENT = "#FFB4E3";
const ACCENT_2 = "#A0CFFC";
// Kyle's date for this site (owner, 2026-10-14): start and publish date; it is the oldest project (No.01)
const DATED = "2026-01-20";
const PUBLISHED_AT = new Date(`${DATED}T09:00:00+08:00`);

const project = {
  slug: SLUG,
  title: "Moeko Works Portfolio",
  tagline: "This portfolio itself: a pastel “Bloom Expo” site with video previews, story-like project pages, cookieless statistics and smooth motion.",
  descriptionMd: [
    "**Moeko Works Portfolio** is the home of Moeko Works: the site where Kyle Zoleta shows what he builds, from creative websites to the systems behind them. Every project gets its own page with a preview video, what you can do with it, how it works behind the scenes and what it is made with.",
    "Its look, **“Bloom Expo,”** pairs the structure of an expo site with a pastel palette of pinks and blues: sticker labels, giant outlined words, rotating badges and the logo's five-petal flower everywhere. Motion follows one tempo (120 BPM): a splash that assembles the logo, letter pops, scroll-driven reveals, outline flowers drifting behind the pages, and a Motion switch for a calm version.",
    "It runs on **Next.js 16** with React server components, MUI and plain CSS in cascade layers, Drizzle ORM on Neon Postgres and Cloudinary for media, hosted on Vercel in Singapore. Cookieless first-party statistics, a spam-protected contact form and a performance pass that keeps it smooth on modest laptops complete the picture.",
  ].join("\n\n"),
  category: "web",
  platforms: ["web"],
  lifecycle: "live",
  role: "Solo developer: design, front end, back end, analytics, media pipeline",
  startedOn: DATED,
  finishedOn: null,
  credits: [] as { name: string; role: string }[],
  accentColor: ACCENT,
  accentColor2: ACCENT_2,
  accentStrong: strongOf(ACCENT),
  accentOn: onAccentOf(ACCENT),
  status: "published",
  disclaimerMd: null,
};

const links = [{ kind: "live", label: null, url: "https://moekoworks.vercel.app/", note: "moekoworks.vercel.app", isPrimary: true }];

// [tech slug, usage note]
const stack: [string, string][] = [
  ["nextjs", "App Router: pre-rendered pages that refresh every 10 minutes or right after an edit, server actions, a route proxy."],
  ["react", "Server components for every page; small client islands for motion, video and the contact form."],
  ["typescript", "End to end, from the database schema to the pages."],
  ["mui", "Form controls, layered under the site's own styles."],
  ["css", "Cascade layers, scroll-driven reveals and compositor-only animations."],
  ["lenis", "Smooth wheel scrolling on desktop, running only while you scroll."],
  ["canvas-confetti", "Flower confetti when a message is sent."],
  ["lucide", "Interface icons."],
  ["simple-icons", "Brand logos in the technology chips and social links."],
  ["drizzle", "Typed schema, migrations and queries."],
  ["zod", "Validation of every form and server action."],
  ["neon", "Serverless Postgres in Singapore over the HTTP driver."],
  ["postgresql", "Projects, messages and statistics rollups, guarded by check constraints."],
  ["cloudinary", "Image and video delivery: WebP/AVIF in the right size, pre-generated video renditions."],
  ["vercel", "Hosting in Singapore (sin1) with security headers and a nightly statistics cron."],
  ["playwright", "Scripted captures of every project's screenshots and preview videos, and the performance benchmarks."],
  ["ffmpeg", "Editing the preview videos, hover loops and end cards."],
];

// [audience, title, body, icon] (no "For admins" cards for this project, owner 2026-10-14)
const operations: [string, string, string, string][] = [
  ["visitor", "A splash with real progress", "On the first visit the logo assembles while fonts, first-screen images and the page load; the percentage is real, then the logo flies into its place in the sidebar.", "sparkles"],
  ["visitor", "See the latest work first", "Home opens on a key-visual stage, then the newest project with its preview video playing, a news ticker, a profile strip and the Works grid.", "play"],
  ["visitor", "Preview on hover", "Every project card and History row plays an 8-second loop when you point at it; on History the preview floats next to the pointer.", "click"],
  ["visitor", "Read a whole project story", "Each project page builds itself from its data: overview, what you can do, behind the scenes, technologies with notes, a gallery in device frames with a lightbox, links and credits. Empty sections disappear.", "layers"],
  ["visitor", "A colour for every project", "Project pages take their accent colours from the project itself, with readable text colours computed automatically.", "palette"],
  ["visitor", "Browse the toolbox", "A ribbon of every technology used in the published projects, with how many projects use each one.", "wrench"],
  ["visitor", "Get to know Kyle", "The About page: a profile, what he makes, the toolbox by group and certifications with a viewer.", "user"],
  ["visitor", "Send a message", "A contact form with a honeypot, a minimum fill time, a rate limit and a spam score, and flower confetti when it's sent.", "megaphone"],
  ["visitor", "Turn motion off", "A Motion switch (remembered) and the device's reduced-motion setting give a calm, still version of every page.", "wand"],
  ["visitor", "Flowers everywhere", "Outline flowers drift down behind the pages and tiny flowers, hearts and sparkles trail the mouse on desktop.", "heart"],
  ["visitor", "Made for phones too", "A top bar with a full-screen menu, single-column layouts and phone-framed screenshots.", "devices"],
  ["system", "Smooth on modest hardware", "A performance pass with no visual change: compositor-only animations, no frame loop while idle, paused off-screen sections. Scrolling went from about 30 to 54–60 fps on a Ryzen 3 laptop.", "gauge"],
  ["system", "Cookieless statistics", "A first-party tracker with daily-salted visitor hashes, no stored IP addresses, bot filtering and a nightly rollup.", "shield-check"],
  ["system", "Fast, always-fresh pages", "Pages are pre-rendered and refreshed every 10 minutes or right after an edit; a renamed project page redirects permanently to its new address.", "refresh"],
  ["system", "Media prepared once", "Images arrive as WebP or AVIF in the size the screen needs; videos play pre-generated H.264 and VP9 renditions and an 8-second hover cut.", "cloud"],
  ["system", "Secure by default", "HSTS, frame and content-type protections, a strict permissions policy and a Content-Security-Policy in report-only mode.", "shield"],
  ["system", "Found by search engines", "A sitemap, robots rules, a share image for every project and structured data for the site and its author.", "search"],
  ["system", "One pipeline per project", "Scripted capture, encoding, signed uploads and a seed turn a live site into a finished project page.", "workflow"],
];

// [upload key, role, frame, alt, caption]
const media: [string, string, string, string, string | null][] = [
  ["preview", "preview", "browser", "Preview of Moeko Works Portfolio: the splash, Home, the Works grid, a History hover preview, a project page, About and Contact.", null],
  ["hover", "hover", "browser", "Short preview of Moeko Works Portfolio's home page arriving and scrolling to the latest project.", null],
  ["home", "gallery", "browser", "Moeko Works home page: the pastel stage with the Moeko Works logo, the portfolio introduction and the latest project's preview video.", "Home: the key-visual stage and the latest project."],
  ["works", "gallery", "browser", "The Works grid on the home page: the featured latest project, the next project and the profile strip above.", "Works: the newest projects with hover previews."],
  ["history", "gallery", "browser", "The History page listing every project, with a preview video floating next to the hovered row.", "History: every project, with a floating preview."],
  ["project", "gallery", "browser", "A project page hero: title, one-line description, status chips, a Visit button and the preview video in a browser frame.", "A project page: the hero."],
  ["project-ops", "gallery", "browser", "A project page's “What you can do” section with numbered feature cards.", "A project page: what you can do."],
  ["project-tech", "gallery", "browser", "A project page's “Built with” section: a ribbon of technologies and grouped cards with usage notes.", "A project page: built with."],
  ["about", "gallery", "browser", "The About page with the profile card and its details.", "About: the profile."],
  ["contact", "gallery", "browser", "The Contact page: contact details and the message form.", "Contact: details and the message form."],
  ["splash", "gallery", "browser", "The first-visit splash: the Moeko Works logo assembling with a loading percentage.", "Splash: real loading progress."],
  ["toolbox", "gallery", "browser", "The Toolbox ribbon and the Certifications strip on the home page.", "Toolbox and certifications."],
  ["phone-home", "gallery", "phone", "Moeko Works on a phone: the news ticker, the logo, the introduction and the latest project.", "On a phone: Home."],
  ["phone-project", "gallery", "phone", "A project page on a phone: the hero with its preview and Visit button.", "On a phone: a project page."],
  ["phone-menu", "gallery", "phone", "The full-screen phone menu with About, Contact and History, social links and the Motion switch.", "On a phone: the menu."],
];

// operation title → screenshot shown in its card (none: no admin cards for this project)
const opMedia: Record<string, string> = {};

type Upload = { public_id: string; version: number; format: string; width: number; height: number; bytes: number; duration?: number; resource_type: string; dominant?: string | null };
const uploads: Record<string, Upload> = JSON.parse(readFileSync(join(import.meta.dirname, "capture", "out", "moekoworks", "uploads.json"), "utf8"));
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
  .values({ ...project, publishedAt: PUBLISHED_AT })
  .onConflictDoUpdate({
    target: schema.projects.slug,
    set: { ...project, updatedAt: sql`now()`, publishedAt: PUBLISHED_AT },
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
