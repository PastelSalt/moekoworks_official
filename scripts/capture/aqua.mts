// Captures Aqua Iro Archive media from the live site (playbook §5): screenshots + a screencast for the preview video.
// Uses the installed Chrome (no browser download). The site's Umami endpoints (/s/ui.js, /s/api/pulse) are blocked
// so its statistics stay clean. Stills skip the loading screen, title screen and first-visit tour through the site's
// own storage keys (src/lib/storage.ts); the video starts from a fresh visit. Output: scripts/capture/out/aqua/.
//
//   npx tsx scripts/capture/aqua.mts [--shots] [--video]
import { mkdirSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

const SITE = "https://aqua-iro-archive.vercel.app";
const OUT = join(import.meta.dirname, "out", "aqua");
const FRAMES = join(OUT, "frames");
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const args = new Set(process.argv.slice(2));
const all = !args.has("--shots") && !args.has("--video");
mkdirSync(FRAMES, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function context(browser: Browser, { mobile = false, size = { width: 1920, height: 1080 }, returning = true } = {}): Promise<BrowserContext> {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "en-US", userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36" }
      : { viewport: size, deviceScaleFactor: 1, locale: "en-US", reducedMotion: "no-preference" },
  );
  await ctx.route(/\/s\/(ui\.js|api\/pulse)/, (r) => r.abort()); // never pollute the archive's Umami statistics
  if (returning) {
    // a returning visitor: title screen seen, tour done, dock hint dismissed, splash already shown this session
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("aia:title", JSON.stringify("1"));
        localStorage.setItem("aia:tour.done", "true");
        localStorage.setItem("aia:hint.dock", "true");
        localStorage.setItem("aia:visited", "true");
        sessionStorage.setItem("aia:splash", "1");
      } catch {
        /* storage blocked */
      }
    });
  }
  return ctx;
}

async function open(page: Page, path = "/", settle = 3500) {
  await page.goto(SITE + path, { waitUntil: "networkidle", timeout: 90_000 });
  await sleep(settle);
}

async function shots(browser: Browser) {
  // the first-visit title screen
  const fresh = await context(browser, { returning: false });
  const fp = await fresh.newPage();
  await fp.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await fp.locator("[data-splash-start]").waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
  await sleep(1500);
  await fp.screenshot({ path: join(OUT, "d01-title.png") });
  await fresh.close();

  const ctx = await context(browser);
  const page = await ctx.newPage();
  await open(page, "/", 5000);
  await page.screenshot({ path: join(OUT, "d02-home.png") });
  for (const [file, path] of [
    ["d03-about", "/about"],
    ["d04-clips", "/clips"],
    ["d05-discography", "/discography"],
    ["d06-streaming", "/streaming"],
    ["d07-events", "/events"],
    ["d08-arts", "/arts"],
    ["d09-messages", "/messages"],
  ] as const) {
    await open(page, path);
    await page.screenshot({ path: join(OUT, `${file}.png`) });
  }
  await ctx.close();

  const m = await context(browser, { mobile: true });
  const mp = await m.newPage();
  await open(mp, "/", 5000);
  // on a phone the once-per-session "On this day" toast covers the page: close it (the desktop shot keeps it)
  await mp.getByRole("button", { name: /^Close$/ }).first().click({ timeout: 3000 }).catch(() => undefined);
  await sleep(900);
  await mp.screenshot({ path: join(OUT, "m01-home.png") });
  await open(mp, "/arts");
  await mp.screenshot({ path: join(OUT, "m02-arts.png") });
  await m.close();
}

async function video(browser: Browser) {
  const ctx = await context(browser, { size: { width: 1280, height: 720 }, returning: false });
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
  await page.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.locator("[data-splash-start]").waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
  mark("title");
  await sleep(2200);
  await page.keyboard.press("Enter"); // PRESS START
  mark("home");
  // the first-visit tour starts once the splash has gone: let its welcome card show, then Esc skips it
  await page.locator("text=Welcome aboard").first().waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined);
  await sleep(1400);
  await page.keyboard.press("Escape").catch(() => undefined);
  await sleep(1200);
  // close the once-per-session "On this day" toast so it doesn't sit over every chapter
  await page.getByRole("button", { name: /^Close$/ }).first().click({ timeout: 2000 }).catch(() => undefined);
  await sleep(2600); // Home with the Talk box
  // the chapters, through the site's own links (page-switch shutter included)
  for (const path of ["/about", "/discography", "/streaming", "/events", "/arts", "/messages"]) {
    const link = page.locator(`a[href="${path}"]`).locator("visible=true").first();
    const clicked = (await link.count()) ? await link.click({ timeout: 3000 }).then(() => true, () => false) : false;
    if (!clicked) await page.goto(SITE + path);
    mark(path.slice(1));
    await sleep(3400);
  }
  mark("end");
  await cdp.send("Page.stopScreencast");
  await sleep(300);

  // ffconcat list with real frame durations (variable frame rate → 30 fps at encode time). Frames that arrive within
  // 1/90 s of the previous one are dropped: clamping each to a minimum length stretched a 63 s capture to 102 s.
  const lines = ["ffconcat version 1.0"];
  frames.sort((a, b) => a.t - b.t);
  const kept = frames.filter((f, i) => i === 0 || f.t - frames[i - 1].t >= 1 / 90);
  kept.forEach((f, i) => {
    const next = kept[i + 1]?.t ?? f.t + 1 / 30;
    lines.push(`file 'frames/${f.file}'`, `duration ${(next - f.t).toFixed(4)}`);
  });
  lines.push(`file 'frames/${kept.at(-1)?.file}'`);
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
