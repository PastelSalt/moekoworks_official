// Rebuilds scripts/capture/out/<folder>/uploads.json from a project's media rows, so a seed can be re-run
// with --replace after the git-ignored capture outputs are gone (new machine, wiped folder).
// Keys are the last segment of each public_id (e.g. moekoworks-official/projects/kotoha-fansite/home → "home").
//
//   npx tsx scripts/capture/uploads-from-db.mts <project slug> <out folder>   e.g. kotoha-fansite kotoha
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "../_db.mts";

const [slug, folder] = process.argv.slice(2);
if (!slug || !folder) {
  console.error("usage: uploads-from-db.mts <project slug> <out folder>");
  process.exit(1);
}
const [project] = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.slug, slug)).limit(1);
if (!project) throw new Error(`no project "${slug}"`);
const rows = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.projectId, project.id));
const uploads = Object.fromEntries(
  rows.map((m) => [
    m.publicId.split("/").at(-1),
    {
      public_id: m.publicId,
      version: m.version,
      format: m.format,
      width: m.width,
      height: m.height,
      bytes: m.bytes,
      duration: m.durationMs ? m.durationMs / 1000 : null,
      resource_type: m.kind === "video" ? "video" : "image",
      dominant: m.dominantColor,
    },
  ]),
);
const out = join(import.meta.dirname, "out", folder);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "uploads.json"), JSON.stringify(uploads, null, 2));
console.log(`${rows.length} media → ${join(out, "uploads.json")}: ${Object.keys(uploads).join(", ")}`);
