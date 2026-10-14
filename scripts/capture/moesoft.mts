// Captures the Moesoft site itself (production) for its own project page: screenshots + a screencast for the
// preview video. Never counted in Moesoft's statistics (ms_nt + /api/track answered locally). A fine pointer is
// emulated so Lenis, hover previews and the cursor sparkles behave as on a desktop. Output:
// scripts/capture/out/moesoft/ (git-ignored). Then run encode-moesoft.sh.
//
//   npx tsx scripts/capture/moesoft.mts [--shots] [--video]
import { mkdirSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

const SITE = "https://moesoft.vercel.app";
const OUT = join(import.meta.dirname, "out", "moesoft");
const FRAMES = join(OUT, "frames");
const args = new Set(process.argv.slice(2));
const all = !args.has("--shots") && !args.has("--video");
mkdirSync(FRAMES, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function context(browser: Browser, { mobile = false, splash = false, size = { width: 1920, height: 1080 } } = {}): Promise<BrowserContext> {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "en-US", userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36" }
      : { viewport: size, deviceScaleFactor: 1, locale: "en-US", reducedMotion: "no-preference" },
  );
  await ctx.route(/\/api\/track/, (r) => r.fulfill({ status: 204 })); // never pollute Moesoft's statistics
  await ctx.addInitScript(
    ({ splash, mobile }) => {
      try {
        localStorage.setItem("ms_nt", "1");
        if (!splash) sessionStorage.setItem("ms_splash", "1");
      } catch {}
      if (!mobile) {
        const mm = window.matchMedia.bind(window);
        window.matchMedia = (q: string) =>
          q === "(pointer: fine)" ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } as unknown as MediaQueryList) : mm(q);
      }
    },
    { splash, mobile },
  );
  return ctx;
}

/** Scrolls an element to ~80 px below the top with wheel steps (Lenis glides like a real mouse wheel). */
async function wheelTo(page: Page, selector: string, step = 120, pause = 45) {
  const target = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY - 80 : window.scrollY;
  }, selector);
  await page.mouse.move(700, 420);
  let y = await page.evaluate(() => window.scrollY);
  const dir = target > y ? 1 : -1;
  while ((target - y) * dir > step) {
    await page.mouse.wheel(0, step * dir);
    await sleep(pause);
    y += step * dir;
  }
  await sleep(900);
}

async function go(page: Page, href: string, settle = 2600) {
  await page.evaluate((h) => document.querySelector<HTMLAnchorElement>(`.sidebar a[href="${h}"], a[href="${h}"]`)?.click(), href);
  await page.waitForURL((u) => u.pathname === href, { timeout: 30_000 });
  await sleep(settle);
}

async function shots(browser: Browser) {
  // splash (first visit)
  const s = await context(browser, { splash: true });
  const sp = await s.newPage();
  await sp.goto(SITE + "/", { waitUntil: "domcontentloaded" });
  await sleep(1300);
  await sp.screenshot({ path: join(OUT, "d01-splash.png") });
  await s.close();

  const ctx = await context(browser);
  const page = await ctx.newPage();
  await page.goto(SITE + "/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => [...document.querySelectorAll("video")].some((v) => v.readyState >= 3), null, { timeout: 20_000 }).catch(() => undefined);
  await sleep(2500);
  await page.screenshot({ path: join(OUT, "d02-home.png") });
  await wheelTo(page, ".works");
  await sleep(1500);
  await page.screenshot({ path: join(OUT, "d03-works.png") });
  await wheelTo(page, ".toolbox");
  await page.screenshot({ path: join(OUT, "d04-toolbox.png") });

  await page.goto(SITE + "/history", { waitUntil: "networkidle" });
  await sleep(2500);
  const row = page.locator("main a[href^='/history/']").first();
  const box = await row.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height / 2, { steps: 8 });
    // floating preview: wait until its video has frames
    await page.waitForFunction(() => [...document.querySelectorAll<HTMLVideoElement>(".hpreview video")].some((v) => v.readyState >= 3), null, { timeout: 20_000 }).catch(() => undefined);
    await sleep(1200);
  }
  await page.screenshot({ path: join(OUT, "d05-history.png") });

  await page.goto(SITE + "/history/hanon-fansite", { waitUntil: "networkidle" });
  await page.mouse.move(1800, 1000);
  await sleep(3000);
  await page.screenshot({ path: join(OUT, "d06-project.png") });
  await wheelTo(page, "#ops-visitor");
  await sleep(1200);
  await page.screenshot({ path: join(OUT, "d07-project-ops.png") });
  await wheelTo(page, "#built-title");
  await sleep(1200);
  await page.screenshot({ path: join(OUT, "d08-project-tech.png") });

  await page.goto(SITE + "/about", { waitUntil: "networkidle" });
  await sleep(3000);
  await page.screenshot({ path: join(OUT, "d09-about.png") });
  await page.goto(SITE + "/contact", { waitUntil: "networkidle" });
  await sleep(3000);
  await page.screenshot({ path: join(OUT, "d10-contact.png") });
  await ctx.close();

  const m = await context(browser, { mobile: true });
  const mp = await m.newPage();
  await mp.goto(SITE + "/", { waitUntil: "networkidle" });
  await sleep(3000);
  await mp.screenshot({ path: join(OUT, "m01-home.png") });
  await mp.goto(SITE + "/history/kotoha-fansite", { waitUntil: "networkidle" });
  await sleep(3000);
  await mp.screenshot({ path: join(OUT, "m02-project.png") });
  await mp.locator("button:has-text('Menu'), button[aria-label*='menu' i]").first().click().catch(() => undefined);
  await sleep(1400);
  await mp.screenshot({ path: join(OUT, "m03-menu.png") });
  await m.close();
}

async function video(browser: Browser) {
  const ctx = await context(browser, { splash: true, size: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames: { t: number; file: string }[] = [];
  let n = 0;
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => undefined); // ack first: next frame can start
    const file = `f${String(++n).padStart(5, "0")}.jpg`;
    frames.push({ t: metadata.timestamp ?? Date.now() / 1000, file });
    writeFile(join(FRAMES, file), Buffer.from(data, "base64")).catch(() => undefined);
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
  const marks: Record<string, number> = {};
  const mark = (k: string) => (marks[k] = Date.now() / 1000);

  mark("start");
  await page.goto(SITE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.dataset.splash !== "show", null, { timeout: 15_000 }).catch(() => undefined);
  mark("home");
  await sleep(2600);
  await wheelTo(page, ".works", 90, 40);
  mark("works");
  await sleep(1600);
  await go(page, "/history", 1600);
  await wheelTo(page, "main table, main ol, main ul", 90, 40); // bring the project rows up before hovering
  mark("history");
  const row = page.locator("main a[href^='/history/']").first();
  const box = await row.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 12 });
    await sleep(2400);
    mark("hover");
    await row.click();
    await page.waitForURL(/\/history\/.+/, { timeout: 30_000 });
  }
  await page.mouse.move(1260, 700);
  await sleep(2800);
  mark("project");
  await wheelTo(page, "#ops-visitor", 90, 40);
  mark("ops");
  await sleep(1200);
  await go(page, "/about", 2600);
  mark("about");
  await go(page, "/contact", 2600);
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
  // real GPU (ANGLE on OpenGL) instead of SwiftShader software rendering. On this laptop (Vega 3) the forced
  // hardware video decoder fails every <video> (MEDIA_ERR_DECODE) under these flags, so video decodes in software.
  args: ["--hide-scrollbars", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization", "--disable-accelerated-video-decode"],
});
try {
  if (all || args.has("--shots")) await shots(browser);
  if (all || args.has("--video")) await video(browser);
} finally {
  await browser.close();
}
console.log("done →", OUT);
