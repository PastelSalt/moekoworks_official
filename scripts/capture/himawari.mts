// Captures Himawari's website media from the live site (playbook §5): screenshots + a screencast for the
// preview video. Uses the installed Chrome (no browser download). The site's /api/track is blocked so its
// statistics stay clean. Output: scripts/capture/out/himawari/ (git-ignored). Then run encode-himawari.sh.
// The Studio screenshots come from the engine repo's docs/images (real app captures), not from here.
//
//   npx tsx scripts/capture/himawari.mts [--shots] [--video]
import { mkdirSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

const SITE = "https://himawari-moekoworks.vercel.app";
const OUT = join(import.meta.dirname, "out", "himawari");
const FRAMES = join(OUT, "frames");
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
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
  await ctx.route("**/api/track**", (r) => r.abort()); // never pollute Himawari's statistics
  return ctx;
}

async function open(page: Page, path = "/") {
  await page.goto(SITE + path, { waitUntil: "networkidle", timeout: 60_000 });
}

/** Smooth-scrolls a section to just under the sticky header and waits for its reveals. */
async function goSection(page: Page, id: string, settle = 2400) {
  await page.evaluate((sel) => {
    const el = document.getElementById(sel);
    if (!el) return;
    const head = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - head - 12, behavior: "smooth" });
  }, id);
  await sleep(settle);
}

async function shots(browser: Browser) {
  const ctx = await context(browser);
  const page = await ctx.newPage();
  await open(page);
  await sleep(4500); // the typing hero
  await page.screenshot({ path: join(OUT, "d01-home.png") });
  for (const [file, id] of [["d02-about", "about"], ["d03-features", "features"], ["d04-download", "download"], ["d05-learn", "learn"], ["d06-faq", "faq"]] as const) {
    await goSection(page, id);
    await page.screenshot({ path: join(OUT, `${file}.png`) });
  }
  await open(page, "/docs/tutorials/first-game");
  await sleep(1500);
  await page.screenshot({ path: join(OUT, "d07-docs.png") });
  await open(page, "/ja");
  await sleep(4500);
  await page.screenshot({ path: join(OUT, "d08-japanese.png") });
  await ctx.close();

  const m = await context(browser, true);
  const mp = await m.newPage();
  await open(mp);
  await sleep(4500);
  await mp.screenshot({ path: join(OUT, "m01-home.png") });
  await goSection(mp, "features", 2600);
  await mp.screenshot({ path: join(OUT, "m02-features.png") });
  await m.close();
}

async function video(browser: Browser) {
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
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
  const marks: Record<string, number> = {};
  const mark = (k: string) => (marks[k] = Date.now() / 1000);

  mark("start");
  await open(page);
  mark("home");
  await sleep(5200); // the hero types its line and the docked game answers
  for (const id of ["about", "features"]) {
    await goSection(page, id, 2600);
    mark(id);
  }
  // let the feature rows slide past at reading speed
  await page.evaluate(async () => {
    for (let i = 0; i < 40; i++) {
      scrollBy(0, 30);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await sleep(800);
  mark("features-2");
  for (const id of ["download", "learn", "news"]) {
    await goSection(page, id, 2300);
    mark(id);
  }
  await open(page, "/ja");
  mark("ja");
  await sleep(4600);
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

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });
try {
  if (all || args.has("--shots")) await shots(browser);
  if (all || args.has("--video")) await video(browser);
} finally {
  await browser.close();
}
console.log("done →", OUT);
