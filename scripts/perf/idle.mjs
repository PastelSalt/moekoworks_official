// Idle cost (docs/PERFORMANCE_PLAN.md): main-thread task / script / style milliseconds per second over 10 s on an
// untouched page. Fine pointer emulated (Lenis on) unless the label contains "nolenis"; "noio" stubs
// IntersectionObserver; "nojs" blocks the site's scripts; "rm:<selector>" removes elements; css = extra styles.
//   node scripts/perf/idle.mjs <url> ["<css>"] [label]
import { chromium } from "playwright-core";
const [, , url, css = "", label = "base"] = process.argv;
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization"] });
try {
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.route(/\/api\/track/, (r) => r.fulfill({ status: 204 }));
  if (label.includes("nojs")) await ctx.route(/\.js(\?|$)/, (r) => r.abort());
  await ctx.addInitScript(`window.__noio = ${label.includes("noio")};`);
  await ctx.addInitScript(({ nolenis }) => {
    window.__nolenis = nolenis;
    if (window.__noio) window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    try { sessionStorage.setItem("ms_splash", "1"); localStorage.setItem("ms_nt", "1"); } catch {}
    const mm = window.matchMedia.bind(window);
    window.matchMedia = (q) => (q === "(pointer: fine)" ? { matches: !window.__nolenis, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q));
  }, { nolenis: label.includes("nolenis") });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  await p.goto(url, { waitUntil: "networkidle" });
  if (css) await p.addStyleTag({ content: css }); // after hydration (React rebuilds <head>)
  if (label.startsWith("rm:")) await p.evaluate((sel) => document.querySelectorAll(sel).forEach((e) => e.remove()), label.slice(3));
  if (label.includes("nosplashimg")) await p.evaluate(() => document.querySelectorAll("img[src*=moesoft-splash]").forEach((i) => i.remove()));
  await p.waitForTimeout(4000);
  const m = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const st = await p.evaluate(() => ({ running: document.getAnimations().filter((x) => x.playState === "running").length, ff: document.querySelector(".flowerfall") ? getComputedStyle(document.querySelector(".flowerfall")).display : "gone", nodes: document.getElementsByTagName("*").length, injected: document.querySelectorAll("head > style").length }));
  const a = await m(); await p.waitForTimeout(10000); const z = await m();
  console.log(JSON.stringify(st));
  console.log(label.padEnd(10), JSON.stringify({ taskMsPerSec: +(((z.TaskDuration - a.TaskDuration) * 1000) / 10).toFixed(1), scriptMsPerSec: +(((z.ScriptDuration - a.ScriptDuration) * 1000) / 10).toFixed(1), styleMsPerSec: +(((z.RecalcStyleDuration - a.RecalcStyleDuration) * 1000) / 10).toFixed(1) }));
} finally { await b.close(); }
