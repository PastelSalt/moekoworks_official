// Screenshots a fan site admin panel served by admin-local.mjs (1920×1080, reduced motion). Signs in as the local
// test owner, archives the oldest news item and video in that in-memory copy so the Archive page has entries,
// then captures each admin page as PNG.
//   node scripts/capture/admin-shots.mjs <login json> <out dir> [port=3100]
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
const [, , loginFile, OUT, port = "3100"] = process.argv;
const login = JSON.parse(readFileSync(loginFile, "utf8"));
mkdirSync(OUT, { recursive: true });
const base = `http://localhost:${port}`;
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl"] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, locale: "en-US", reducedMotion: "reduce" });
await ctx.route(/^https?:\/\/(?!localhost|res\.cloudinary\.com|i\.ytimg\.com|img\.youtube\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com)/, (r) => r.abort());
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill("#username", login.username); await page.fill("#password", login.password); await page.keyboard.press("Enter");
await page.waitForURL(/\/admin/, { timeout: 60000 }); await page.waitForLoadState("networkidle"); await page.waitForTimeout(2500);
// archive two old items through the admin API (local in-memory copy only) so the Archive page has entries
const archived = await page.evaluate(async () => {
  const j = (p, o) => fetch(`/api/admin/${p}`, { credentials: "same-origin", headers: { Accept: "application/json", "Content-Type": "application/json" }, ...o }).then((r) => r.json());
  const out = [];
  for (const [kind, reason] of [["news", "Posted twice"], ["videos", "Replaced by the official upload"]]) {
    const list = await j(`${kind}?limit=50`);
    const items = list.items || [];
    const old = items[items.length - 1];
    if (old) out.push(await j(`${kind}/${old.id}`, { method: "DELETE", body: JSON.stringify({ reason }) }));
  }
  return out;
});
console.log("archived:", JSON.stringify(archived));
const shot = async (name, hash, scroll = 0) => {
  if (hash) { await page.evaluate((h) => (location.hash = h), hash); await page.waitForLoadState("networkidle"); await page.waitForTimeout(2500); }
  if (scroll) { await page.evaluate((y) => scrollTo(0, y), scroll); await page.waitForTimeout(1200); }
  await page.screenshot({ path: `${OUT}/${name}.png` });
};
await shot("dashboard", "#/dashboard"); await shot("statistics", null, 900);
await shot("videos", "#/videos"); await shot("gallery", "#/gallery"); await shot("archive", "#/archive");
await shot("activity", "#/activity"); await shot("accounts", "#/accounts"); await shot("account", "#/account");
console.log("errors:", errs);
await b.close();
