// Captures Kotoha Fan Site media from the live site (plan §21.5–21.7): screenshots + a screencast for the
// preview video. Uses the installed Chrome (no browser download). Kotoha's /api/track is blocked so its
// statistics stay clean. Output: scripts/capture/out/kotoha/ (git-ignored). Then run encode.sh.
//
//   npx tsx scripts/capture/kotoha.mts [--shots] [--video]
import { mkdirSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

const SITE = "https://kotoha-fansite.vercel.app/";
const OUT = join(import.meta.dirname, "out", "kotoha");
const FRAMES = join(OUT, "frames");
const args = new Set(process.argv.slice(2));
const all = !args.has("--shots") && !args.has("--video");
mkdirSync(FRAMES, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function context(browser: Browser, mobile = false, size = { width: 1920, height: 1080 }): Promise<BrowserContext> {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "en-US", userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36" }
      : { viewport: size, deviceScaleFactor: 1, locale: "en-US", reducedMotion: "no-preference" },
  );
  await ctx.route("**/api/track**", (r) => r.abort()); // never pollute Kotoha's statistics
  return ctx;
}

async function open(page: Page) {
  await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 60_000 });
}

async function waitIntro(page: Page) {
  await page.waitForFunction(() => !document.querySelector("#loader") || getComputedStyle(document.querySelector("#loader")!).display === "none" || document.documentElement.dataset.loaded === "1" || document.querySelector("#loader")?.getAttribute("hidden") !== null, null, { timeout: 20_000 }).catch(() => undefined);
  await sleep(2600);
}

async function goSection(page: Page, id: string, settle = 3200) {
  await page.evaluate((sel) => {
    const link = document.querySelector<HTMLAnchorElement>(`a[href="#${sel}"]`);
    if (link) link.click();
    else document.getElementById(sel)?.scrollIntoView();
  }, id);
  await sleep(settle);
}

async function shots(browser: Browser) {
  const ctx = await context(browser);
  const page = await ctx.newPage();
  await open(page);
  await sleep(1200);
  await page.screenshot({ path: join(OUT, "d01-loader.png") });
  await waitIntro(page);
  await page.screenshot({ path: join(OUT, "d02-home.png") });
  await goSection(page, "about");
  await page.screenshot({ path: join(OUT, "d03-about.png") });
  await goSection(page, "news");
  await page.screenshot({ path: join(OUT, "d04-news.png") });
  await goSection(page, "discography");
  await page.screenshot({ path: join(OUT, "d05-discography.png") });
  await goSection(page, "gallery", 4200);
  await page.screenshot({ path: join(OUT, "d06-gallery.png") });
  const tile = page.locator("#masonry a, #masonry button, #masonry figure").first();
  if (await tile.count()) {
    await tile.click();
    await sleep(1600);
    await page.screenshot({ path: join(OUT, "d07-lightbox.png") });
    await page.keyboard.press("Escape");
    await sleep(800);
  }
  await goSection(page, "home");
  const lang = page.locator(`[data-lang-switch] button[lang="ja"]`).locator("visible=true").first();
  if (await lang.count()) {
    await lang.click();
    await sleep(2600);
    await page.screenshot({ path: join(OUT, "d08-japanese.png") });
  }
  await ctx.close();

  const m = await context(browser, true);
  const mp = await m.newPage();
  await open(mp);
  await waitIntro(mp);
  await mp.screenshot({ path: join(OUT, "m01-home.png") });
  await mp.evaluate(() => document.getElementById("gallery")?.scrollIntoView());
  await sleep(2600);
  await mp.screenshot({ path: join(OUT, "m02-gallery.png") });
  await m.close();
}

async function video(browser: Browser) {
  // 1280×720 on the GPU renders at ~38 fps in headless Chrome (1080p manages ~20): smooth 30 fps output
  const ctx = await context(browser, false, { width: 1280, height: 720 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames: { t: number; file: string }[] = [];
  let n = 0;
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    // ack first so Chrome can produce the next frame while this one is written
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => undefined);
    const file = `f${String(++n).padStart(5, "0")}.jpg`;
    frames.push({ t: metadata.timestamp ?? Date.now() / 1000, file });
    writeFile(join(FRAMES, file), Buffer.from(data, "base64")).catch(() => undefined);
  });
  // 1280 px is the largest size the site delivers, and halves the per-frame cost (smoother capture)
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
  const marks: Record<string, number> = {};
  const mark = (k: string) => (marks[k] = Date.now() / 1000);

  mark("start");
  await open(page);
  await waitIntro(page); // loader → iris → home intro
  mark("home");
  await sleep(1800);
  for (const id of ["about", "news", "discography"]) {
    await goSection(page, id, 2700);
    mark(id);
  }
  await goSection(page, "gallery", 2600);
  mark("gallery");
  const tile = page.locator("#masonry button.tile").first();
  if (await tile.count()) {
    await tile.click();
    await sleep(2300);
    mark("lightbox");
    await page.keyboard.press("Escape");
    await sleep(900);
  }
  await goSection(page, "home", 2000);
  const lang = page.locator(`[data-lang-switch] button[lang="ja"]`).locator("visible=true").first();
  if (await lang.count()) {
    await lang.click();
    mark("lang");
    await sleep(2600);
  }
  mark("end");
  await cdp.send("Page.stopScreencast");
  await sleep(300);

  // ffconcat list with real frame durations (variable frame rate → 30 fps at encode time)
  const lines = ["ffconcat version 1.0"];
  frames.sort((a, b) => a.t - b.t);
  frames.forEach((f, i) => {
    const next = frames[i + 1]?.t ?? f.t + 1 / 30;
    lines.push(`file 'frames/${f.file}'`, `duration ${Math.max(1 / 60, next - f.t).toFixed(4)}`);
  });
  lines.push(`file 'frames/${frames.at(-1)?.file}'`);
  writeFileSync(join(OUT, "frames.ffconcat"), lines.join("\n"));
  const t0 = frames[0]?.t ?? marks.start;
  writeFileSync(join(OUT, "marks.json"), JSON.stringify(Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, +(v - t0).toFixed(2)])), null, 2));
  console.log(`${frames.length} frames over ${(frames.at(-1)!.t - t0).toFixed(1)} s`, marks);
  await ctx.close();
}

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  // real GPU (ANGLE on OpenGL) instead of SwiftShader software rendering
  args: ["--hide-scrollbars", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization"],
});
try {
  if (all || args.has("--shots")) await shots(browser);
  if (all || args.has("--video")) await video(browser);
} finally {
  await browser.close();
}
console.log("done →", OUT);
