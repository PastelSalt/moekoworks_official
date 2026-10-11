// Runs a fan site's own dev server (Kotoha / Hanon code base) on an in-memory PGlite database, so the admin
// panel can be screenshotted without touching any real database.
//   node scripts/capture/admin-local.mjs <repo dir> <public site url> <port> <login json out (scratchpad)>
// Hanon has the PGlite dev dependency and the lib/db.js hook (globalThis.__hfDevDb) built in. For Kotoha use a
// scratch clone: `npm ci --omit=dev`, `npm i --no-save @electric-sql/pglite`, and add the same first line to
// sql() in its lib/db.js (`if (globalThis.__hfDevDb) return globalThis.__hfDevDb;`). Stop it with Ctrl+C.
// - loads db/migrations + db/seed.sql, copies the published gallery rows from the site's public API,
// - creates a local test owner "owner" with a random password (written to <login json out>, mode 600),
// - exposes a Neon-compatible client (tagged template, .query, .transaction) as globalThis.__hfDevDb.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [repo, site, port, loginOut] = process.argv.slice(2);
const req = createRequire(path.join(repo, "package.json"));
const { PGlite } = await import(pathToFileURL(req.resolve("@electric-sql/pglite")).href);
const { hash } = req("@node-rs/argon2");

const db = new PGlite();
const dir = path.join(repo, "db", "migrations");
for (const f of (await readdir(dir)).filter((n) => n.endsWith(".sql")).sort()) await db.exec(await readFile(path.join(dir, f), "utf8"));
await db.exec(await readFile(path.join(repo, "db", "seed.sql"), "utf8"));

// published gallery (public data) so the admin gallery isn't empty
const items = [];
for (let cursor = ""; ; ) {
  const r = await fetch(`${site}/api/public/gallery?limit=50${cursor}`).then((x) => x.json());
  items.push(...(r.items || []));
  if (!r.nextCursor || !r.items?.length) break;
  cursor = `&cursor=${encodeURIComponent(r.nextCursor)}`;
}
for (const g of items.reverse()) {
  await db.query(
    `insert into gallery_images (cloudinary_public_id, cloudinary_version, secure_url, width, height, format, bytes, author_name, source_url, created_at)
     values ($1,$2,$3,$4,$5,$6,0,$7,$8,$9) on conflict do nothing`,
    [g.publicId, g.version, g.url, g.width, g.height, g.url.split(".").pop(), g.authorName, g.sourceUrl ?? null, g.createdAt],
  );
}

// local test owner (only exists in this in-memory database)
const password = "local-" + randomBytes(12).toString("base64url");
await db.query(
  `insert into admin_users (username, role, password_hash, must_change_password, password_changed_at) values ('owner', 'owner', $1, false, now())`,
  [await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })],
);
await writeFile(loginOut, JSON.stringify({ username: "owner", password }), { mode: 0o600 });

// Neon-compatible client
const run = (text, params) => db.query(text, params).then((r) => r.rows);
const q = (text, params = []) => ({ text, params, then: (ok, err) => run(text, params).then(ok, err) });
const client = (strings, ...vals) => q(strings.reduce((t, s, i) => t + `$${i}` + s), vals);
client.query = (text, params = []) => q(text, params);
client.transaction = async (arg) => {
  const list = typeof arg === "function" ? arg(client) : arg;
  return db.transaction(async (tx) => {
    const out = [];
    for (const x of list) out.push((await tx.query(x.text, x.params)).rows);
    return out;
  });
};
globalThis.__hfDevDb = client;

process.env.DATABASE_URL ||= "postgres://local-pglite-only"; // keeps dev-server.js from opening its own preview db
process.env.PORT = port;
process.env.ALLOWED_ORIGINS = `localhost:${port}`;
process.env.ANALYTICS_SALT = randomBytes(16).toString("hex");
console.log(`in-memory db ready: ${items.length} gallery rows, owner created`);
await import(pathToFileURL(path.join(repo, "scripts", "dev-server.js")).href);
