// Traces one wheel-scroll pass and sums main-thread work by category, plus DOM size, running animations and
// composited layers (docs/PERFORMANCE_PLAN.md). Proportions stay meaningful even on a busy machine.
//   node scripts/perf/trace.mjs <url> [exp: base | lean | lenis | fall, combined with "+"] [w=1920] [h=1080]
import { chromium } from "playwright-core";

const [, , url, exp = "base", w = "1920", h = "1080"] = process.argv;
const noLean = exp.includes("lean"),
  noLenis = exp.includes("lenis"),
  noFall = exp.includes("fall");

const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--hide-scrollbars", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization"] });
try {
  const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
  await ctx.route(/\/api\/track/, (r) => r.fulfill({ status: 204 }));
  await ctx.addInitScript(
    ({ noLean, noLenis }) => {
      try {
        sessionStorage.setItem("ms_splash", "1");
        localStorage.setItem("ms_nt", "1");
      } catch {}
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (q === "(pointer: fine)" ? { matches: !noLenis, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q));
      if (noLean) {
        const o = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function (p, ...r) {
          if (p === "--lean") return;
          return o.call(this, p, ...r);
        };
      }
    },
    { noLean, noLenis },
  );
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  // after hydration: React rebuilds <head> and drops styles injected before it
  if (noFall) await page.addStyleTag({ content: ".flowerfall{display:none!important}" });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => ({ nodes: document.getElementsByTagName("*").length, anims: document.getAnimations().length, running: document.getAnimations().filter((a) => a.playState === "running").length }));
  await cdp.send("LayerTree.enable");
  const layers = await new Promise((res) => {
    cdp.once("LayerTree.layerTreeDidChange", (e) => res(e.layers || []));
    page.evaluate(() => scrollBy(0, 1));
  });
  const reasons = {};
  for (const l of layers.slice(0, 400)) {
    try {
      const r = await cdp.send("LayerTree.compositingReasons", { layerId: l.layerId });
      for (const x of r.compositingReasonIds || r.compositingReasons || []) reasons[x] = (reasons[x] || 0) + 1;
    } catch {}
  }

  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,gpu,viz", transferMode: "ReportEvents" });
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const dir of [1, -1]) {
    for (let i = 0; i < Math.ceil(height / 100) + 4; i++) {
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: +w / 2, y: +h / 2, deltaX: 0, deltaY: 100 * dir });
      await page.waitForTimeout(70);
    }
    await page.waitForTimeout(600);
  }
  await cdp.send("Tracing.end");
  await done;

  // main thread = the renderer thread with the most style + layout work
  const byThread = {};
  for (const e of events) {
    if (e.ph !== "X" || !e.dur) continue;
    const t = (byThread[`${e.pid}:${e.tid}`] ||= {});
    t[e.name] = (t[e.name] || 0) + e.dur;
  }
  const work = (t) => (t.UpdateLayoutTree || 0) + (t.Layout || 0);
  const main = Object.values(byThread).sort((a, x) => work(x) - work(a))[0] || {};
  const ms = (n) => Math.round((main[n] || 0) / 1000);
  console.log(
    JSON.stringify({
      exp,
      ...info,
      layers: layers.length,
      topReasons: Object.entries(reasons)
        .sort((a, x) => x[1] - a[1])
        .slice(0, 8),
      mainMs: { task: ms("RunTask"), script: ms("FunctionCall") + ms("EvaluateScript") + ms("FireAnimationFrame"), style: ms("UpdateLayoutTree"), layout: ms("Layout"), prePaint: ms("PrePaint"), paint: ms("Paint"), layerize: ms("Layerize"), commit: ms("Commit") },
    }),
  );
} finally {
  await b.close();
}
