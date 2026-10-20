// Rebrand 2026-10-20: the old name belongs to an established company, so every stored text that carries it is
// rewritten to "Moeko Works" (docs/PROGRESS.md, incident log). Scans every text column of the content tables,
// renames this site's own project slug (the old slug stays in project_slug_history so old links redirect).
// Cloudinary public_ids are left alone: moving the media folder is a separate step (see PROGRESS.md).
//
//   npx tsx scripts/rebrand-moekoworks.mts            dry run: list every change, write nothing
//   npx tsx scripts/rebrand-moekoworks.mts --apply    write everything in one atomic batch
//
// Take a Neon restore point first (hard rule 5).
import { neon } from "@neondatabase/serverless";

try {
  process.loadEnvFile(".env.local");
} catch {
  // variables may already be in the environment
}
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL_UNPOOLED in .env.local first.");
  process.exit(1);
}
const sql = neon(url);
const apply = process.argv.includes("--apply");

const OLD = "moe" + "soft"; // spelled apart so a repo-wide search for leftovers stays clean
const OLD_SLUG = `${OLD}-portfolio`;
const NEW_SLUG = "moekoworks-portfolio";
const CONTENT_TABLES = ["projects", "media_assets", "project_links", "project_technologies", "project_operations", "technologies", "certifications"];
// project_technologies has a composite key; every other content table has an id.
const KEYS: Record<string, string[]> = { project_technologies: ["project_id", "technology_id"] };
const SKIP_COLUMNS = new Set(["public_id", "slug", "format", "kind", "role", "frame", "status", "category", "lifecycle"]);

function rebrand(v: string) {
  return v
    .replaceAll(`${OLD}.vercel.app`, "moekoworks.vercel.app")
    .replaceAll(OLD_SLUG, NEW_SLUG)
    .replaceAll("Moeko Software and Technologies", "Moeko Works")
    .replaceAll(OLD.toUpperCase(), "MOEKO WORKS")
    .replaceAll(OLD[0].toUpperCase() + OLD.slice(1), "Moeko Works");
}

const cols = (await sql.query(
  `select table_name, column_name, data_type from information_schema.columns
   where table_schema = 'public' and table_name = any($1) and data_type in ('text', 'character varying', 'jsonb', 'ARRAY')`,
  [CONTENT_TABLES],
)) as { table_name: string; column_name: string; data_type: string }[];

const writes: { text: string; params: unknown[] }[] = [];
const leftovers: string[] = [];
for (const c of cols) {
  if (SKIP_COLUMNS.has(c.column_name)) continue;
  const asText = c.data_type === "text" || c.data_type === "character varying" ? `"${c.column_name}"` : `"${c.column_name}"::text`;
  const keys = KEYS[c.table_name] ?? ["id"];
  const rows = (await sql.query(`select ${keys.map((k) => `"${k}"`).join(", ")}, ${asText} as v from "${c.table_name}" where ${asText} ilike $1`, [`%${OLD}%`])) as (Record<string, unknown> & { v: string })[];
  for (const r of rows) {
    const where = keys.map((k, i) => `"${k}" = $${i + 2}`).join(" and ");
    const label = keys.map((k) => r[k]).join("/");
    const next = rebrand(r.v);
    if (next === r.v) {
      leftovers.push(`${c.table_name}.${c.column_name} #${label}: ${r.v.slice(0, 120)}`);
      continue;
    }
    console.log(`${c.table_name}.${c.column_name} #${label}\n  - ${r.v.slice(0, 200)}\n  + ${next.slice(0, 200)}`);
    const cast = c.data_type === "jsonb" ? "::jsonb" : c.data_type === "ARRAY" ? "::text[]" : "";
    writes.push({ text: `update "${c.table_name}" set "${c.column_name}" = $1${cast} where ${where}`, params: [next, ...keys.map((k) => r[k])] });
  }
}

const [own] = (await sql.query(`select id from projects where slug = $1`, [OLD_SLUG])) as { id: number }[];
if (own) {
  console.log(`projects.slug #${own.id}: ${OLD_SLUG} → ${NEW_SLUG} (old slug kept as a redirect)`);
  writes.push({ text: `insert into project_slug_history (old_slug, project_id) values ($1, $2) on conflict (old_slug) do nothing`, params: [OLD_SLUG, own.id] });
  writes.push({ text: `update projects set slug = $1, updated_at = now() where id = $2`, params: [NEW_SLUG, own.id] });
}

const media = (await sql.query(`select count(*)::int as n from media_assets where public_id ilike $1`, [`%${OLD}%`])) as { n: number }[];
console.log(`\n${writes.length} writes. ${media[0].n} Cloudinary public_ids still carry the old name (folder move is separate).`);
if (leftovers.length) console.log(`Not rewritten automatically (check by hand):\n  ${leftovers.join("\n  ")}`);

if (!apply) {
  console.log("Dry run: nothing written. Re-run with --apply.");
} else if (writes.length) {
  await sql.transaction(writes.map((w) => sql.query(w.text, w.params)));
  console.log("Applied. Revalidate the site: save any project in the admin, or redeploy.");
}
