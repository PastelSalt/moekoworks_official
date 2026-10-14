// Tech catalog seed (idempotent upsert by slug). Only technologies actually used in a portfolio project or in this site.
//   npm run seed:tech [-- --dry-run]
import { sql } from "drizzle-orm";
import { db, schema } from "./_db.mts";

type T = { slug: string; name: string; category: string; iconKey?: string; color?: string; url?: string };

export const TECH: T[] = [
  // languages
  { slug: "html5", name: "HTML5", category: "language", iconKey: "html5", url: "https://developer.mozilla.org/docs/Web/HTML" },
  { slug: "css", name: "CSS", category: "language", iconKey: "css", url: "https://developer.mozilla.org/docs/Web/CSS" },
  { slug: "javascript", name: "JavaScript", category: "language", iconKey: "javascript", url: "https://developer.mozilla.org/docs/Web/JavaScript" },
  { slug: "typescript", name: "TypeScript", category: "language", iconKey: "typescript", url: "https://www.typescriptlang.org/" },
  // frameworks & libraries
  { slug: "nextjs", name: "Next.js", category: "framework", iconKey: "nextdotjs", url: "https://nextjs.org/" },
  { slug: "react", name: "React", category: "library", iconKey: "react", url: "https://react.dev/" },
  { slug: "mui", name: "Material UI", category: "library", iconKey: "mui", url: "https://mui.com/" },
  { slug: "gsap", name: "GSAP", category: "library", iconKey: "greensock", url: "https://gsap.com/" },
  { slug: "lenis", name: "Lenis", category: "library", color: "#FF98A2", url: "https://lenis.darkroom.engineering/" },
  { slug: "canvas-confetti", name: "canvas-confetti", category: "library", color: "#E95399", url: "https://github.com/catdad/canvas-confetti" },
  { slug: "lucide", name: "Lucide", category: "library", iconKey: "lucide", url: "https://lucide.dev/" },
  { slug: "simple-icons", name: "Simple Icons", category: "library", iconKey: "simpleicons", url: "https://simpleicons.org/" },
  { slug: "animate-css", name: "Animate.css", category: "library", color: "#8B5CF6", url: "https://animate.style/" },
  { slug: "drizzle", name: "Drizzle ORM", category: "library", iconKey: "drizzle", url: "https://orm.drizzle.team/" },
  { slug: "zod", name: "Zod", category: "library", iconKey: "zod", url: "https://zod.dev/" },
  { slug: "argon2", name: "Argon2id", category: "library", color: "#5D5869", url: "https://github.com/napi-rs/node-rs" },
  // runtime, data, cloud, services
  { slug: "nodejs", name: "Node.js", category: "runtime", iconKey: "nodedotjs", url: "https://nodejs.org/" },
  { slug: "postgresql", name: "PostgreSQL", category: "database", iconKey: "postgresql", url: "https://www.postgresql.org/" },
  { slug: "neon", name: "Neon", category: "database", iconKey: "neon", url: "https://neon.com/" },
  { slug: "pglite", name: "PGlite", category: "database", color: "#5D5869", url: "https://pglite.dev/" },
  { slug: "vercel", name: "Vercel", category: "cloud", iconKey: "vercel", url: "https://vercel.com/" },
  { slug: "cloudinary", name: "Cloudinary", category: "service", iconKey: "cloudinary", url: "https://cloudinary.com/" },
  { slug: "youtube", name: "YouTube embeds", category: "service", iconKey: "youtube", url: "https://developers.google.com/youtube" },
  // tools
  { slug: "sharp", name: "sharp", category: "tool", iconKey: "sharp", url: "https://sharp.pixelplumbing.com/" },
  { slug: "playwright", name: "Playwright", category: "tool", color: "#2EAD33", url: "https://playwright.dev/" },
  { slug: "ffmpeg", name: "FFmpeg", category: "tool", iconKey: "ffmpeg", url: "https://ffmpeg.org/" },
  { slug: "git", name: "Git", category: "tool", iconKey: "git", url: "https://git-scm.com/" },
];

if (process.argv[1]?.endsWith("seed-tech.mts")) {
  const dry = process.argv.includes("--dry-run");
  for (const t of TECH) console.log(`${dry ? "would upsert" : "upsert"} ${t.slug.padEnd(16)} ${t.category.padEnd(9)} ${t.name}`);
  if (!dry) {
    await db
      .insert(schema.technologies)
      .values(TECH.map((t) => ({ slug: t.slug, name: t.name, category: t.category, iconKey: t.iconKey ?? null, color: t.color ?? null, url: t.url ?? null })))
      .onConflictDoUpdate({
        target: schema.technologies.slug,
        set: { name: sql`excluded.name`, category: sql`excluded.category`, iconKey: sql`excluded.icon_key`, color: sql`excluded.color`, url: sql`excluded.url` },
      });
    console.log(`✓ ${TECH.length} technologies upserted`);
  }
}
