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
  { slug: "c", name: "C", category: "language", iconKey: "c", url: "https://en.cppreference.com/w/c" },
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
  { slug: "electron", name: "Electron", category: "framework", iconKey: "electron", url: "https://www.electronjs.org/" },
  { slug: "astro", name: "Astro", category: "framework", iconKey: "astro", url: "https://astro.build/" },
  { slug: "preact", name: "Preact", category: "library", iconKey: "preact", url: "https://preactjs.com/" },
  { slug: "codemirror", name: "CodeMirror", category: "library", iconKey: "codemirror", url: "https://codemirror.net/" },
  { slug: "sdl", name: "SDL 3", category: "library", color: "#1D4F91", url: "https://libsdl.org/" },
  { slug: "freetype", name: "FreeType", category: "library", color: "#4A6A8A", url: "https://freetype.org/" },
  { slug: "mcp", name: "Model Context Protocol", category: "library", iconKey: "modelcontextprotocol", url: "https://modelcontextprotocol.io/" },
  { slug: "better-auth", name: "Better Auth", category: "library", iconKey: "betterauth", url: "https://www.better-auth.com/" },
  { slug: "uplot", name: "uPlot", category: "library", color: "#2D6CDF", url: "https://github.com/leeoniya/uPlot" },
  { slug: "fusejs", name: "Fuse.js", category: "library", color: "#D97706", url: "https://www.fusejs.io/" },
  { slug: "budoux", name: "BudouX", category: "library", color: "#4285F4", url: "https://github.com/google/budoux" },
  // runtime, data, cloud, services
  { slug: "nodejs", name: "Node.js", category: "runtime", iconKey: "nodedotjs", url: "https://nodejs.org/" },
  { slug: "postgresql", name: "PostgreSQL", category: "database", iconKey: "postgresql", url: "https://www.postgresql.org/" },
  { slug: "neon", name: "Neon", category: "database", iconKey: "neon", url: "https://neon.com/" },
  { slug: "pglite", name: "PGlite", category: "database", color: "#5D5869", url: "https://pglite.dev/" },
  { slug: "vercel", name: "Vercel", category: "cloud", iconKey: "vercel", url: "https://vercel.com/" },
  { slug: "cloudinary", name: "Cloudinary", category: "service", iconKey: "cloudinary", url: "https://cloudinary.com/" },
  { slug: "claude", name: "Claude API", category: "service", iconKey: "claude", url: "https://www.anthropic.com/api" },
  { slug: "turnstile", name: "Cloudflare Turnstile", category: "service", iconKey: "cloudflare", url: "https://www.cloudflare.com/application-services/products/turnstile/" },
  { slug: "umami", name: "Umami", category: "service", iconKey: "umami", url: "https://umami.is/" },
  { slug: "discord", name: "Discord webhooks", category: "service", iconKey: "discord", url: "https://discord.com/developers/docs/resources/webhook" },
  { slug: "youtube", name: "YouTube embeds", category: "service", iconKey: "youtube", url: "https://developers.google.com/youtube" },
  // tools
  { slug: "sharp", name: "sharp", category: "tool", iconKey: "sharp", url: "https://sharp.pixelplumbing.com/" },
  { slug: "playwright", name: "Playwright", category: "tool", color: "#2EAD33", url: "https://playwright.dev/" },
  { slug: "ffmpeg", name: "FFmpeg", category: "tool", iconKey: "ffmpeg", url: "https://ffmpeg.org/" },
  { slug: "git", name: "Git", category: "tool", iconKey: "git", url: "https://git-scm.com/" },
  { slug: "vite", name: "Vite", category: "tool", iconKey: "vite", url: "https://vite.dev/" },
  { slug: "pnpm", name: "pnpm", category: "tool", iconKey: "pnpm", url: "https://pnpm.io/" },
  { slug: "cmake", name: "CMake", category: "tool", iconKey: "cmake", url: "https://cmake.org/" },
  { slug: "vitest", name: "Vitest", category: "tool", iconKey: "vitest", url: "https://vitest.dev/" },
  { slug: "github-actions", name: "GitHub Actions", category: "tool", iconKey: "githubactions", url: "https://github.com/features/actions" },
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
