// Scroll benchmark on the real GPU (docs/PERFORMANCE_PLAN.md): wheel-scrolls a page down and back up and records
// every requestAnimationFrame interval. A fresh browser per run; a fine pointer is emulated so Lenis runs like on a
// real mouse/touchpad. Never counted in Moesoft's statistics (ms_nt, /api/track answered locally).
//   node scripts/perf/bench.mjs <url> <exp[,exp…]> [w=1920] [h=1080] [cpu=1]
// Experiments switch one effect group off ("base" = none); combine with "+", e.g. lean+flowerfall.
// Compare back-to-back pairs (base,exp,base,exp…) and use medians: this laptop is noisy (heat, other tabs).
import { chromium } from "playwright-core";

const [, , url, exps = "base", w = "1920", h = "1080", cpu = "1"] = process.argv;
const EXP = {
  base: {},
  calm: { motion: "off" }, // the site's own calm mode = floor with every effect off
  flowerfall: { css: ".flowerfall{display:none!important}" },
  lean: { js: "lean" }, // stop writing --lean on <html>
  lenis: { js: "lenis" }, // coarse pointer → native scrolling instead of Lenis
  stage: { css: ".stage__pattern,.stage__wash{animation:none!important}" },
  stagebg: { css: ".stage__bg{display:none!important}" },
  reveal: { css: ".reveal,.reveal-pop,.parallax{animation:none!important}" },
  loops: { css: ".twinkle,.float,.bob,.badge__ring{animation:none!important}" },
  marquee: { js: "marquee" },
  backdrop: { css: "*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}" },
  filters: { css: "*{filter:none!important}" },
  shadows: { css: "*{box-shadow:none!important}" },
  video: { css: "video{display:none!important}" },
  sticky: { css: ".mbar,.pbar{position:relative!important}" },
};

const launch = () =>
  chromium.launch({
    executablePath: "/usr/bin/google-chrome-stable",
    headless: true,
    // real GPU (ANGLE on OpenGL) instead of SwiftShader software rendering
    args: ["--hide-scrollbars", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl", "--enable-gpu-rasterization"],
  });

async function run(name) {
  const b = await launch();
  const e = name.split("+").reduce((acc, n) => {
    const x = EXP[n];
    if (!x) throw new Error("unknown exp " + n);
    return { css: [acc.css, x.css].filter(Boolean).join(""), js: [...(acc.js || []), x.js].filter(Boolean), motion: x.motion || acc.motion };
  }, {});
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36" });
  await ctx.route(/\/api\/track/, (r) => r.fulfill({ status: 204 }));
  await ctx.addInitScript(({ js, motion }) => {
    try {
      sessionStorage.setItem("ms_splash", "1");
      localStorage.setItem("ms_nt", "1");
      if (motion === "off") localStorage.setItem("ms_motion", "off");
    } catch {}
    {
      const fine = !js.includes("lenis");
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (q === "(pointer: fine)" ? { matches: fine, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q));
    }
    if (js.includes("lean")) {
      const orig = CSSStyleDeclaration.prototype.setProperty;
      CSSStyleDeclaration.prototype.setProperty = function (p, ...r) {
        if (p === "--lean") return;
        return orig.call(this, p, ...r);
      };
    }
    if (js.includes("marquee")) {
      // freeze the marquee rAF loops: transform writes on .marquee__track are dropped
      const desc = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, "transform");
      Object.defineProperty(CSSStyleDeclaration.prototype, "transform", {
        set(v) {
          if (this.__mq) return;
          desc.set.call(this, v);
        },
        get() {
          return desc.get.call(this);
        },
      });
      new MutationObserver(() => document.querySelectorAll(".marquee__track").forEach((t) => (t.style.__mq = true))).observe(document, { subtree: true, childList: true });
    }
  }, e);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (+cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: +cpu });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    // test styles go in after hydration: React rebuilds <head> and silently drops styles injected earlier
    if (e.css) await page.addStyleTag({ content: e.css });
    await page.waitForTimeout(2500);
    const motion = await page.evaluate(() => document.documentElement.dataset.motion + (document.documentElement.classList.contains("lenis") ? "+lenis" : ""));
    await page.evaluate(() => {
      window.__f = [];
      let last = performance.now();
      const tick = (t) => {
        window.__f.push([t - last, scrollY]);
        last = t;
        if (!window.__stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const steps = Math.ceil(height / 100) + 4;
    for (const dir of [1, -1]) {
      for (let i = 0; i < steps; i++) {
        await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: +w / 2, y: +h / 2, deltaX: 0, deltaY: 100 * dir });
        await page.waitForTimeout(70);
      }
      await page.waitForTimeout(600);
    }
    const frames = await page.evaluate(() => {
      window.__stop = true;
      return window.__f.slice(2);
    });
    const d = frames.map((f) => f[0]);
    const total = d.reduce((a, x) => a + x, 0);
    const sorted = [...d].sort((a, x) => a - x);
    const p = (q) => sorted[Math.floor(q * (sorted.length - 1))];
    return { name, motion, fps: +((1000 * d.length) / total).toFixed(1), p50: +p(0.5).toFixed(1), p95: +p(0.95).toFixed(1), janky: d.filter((x) => x > 33.4).length, frames: d.length, secs: +(total / 1000).toFixed(1) };
  } finally {
    await b.close(); // always: a leftover headless browser keeps animating and skews the next runs
  }
}

for (const name of exps.split(",")) {
  console.log(JSON.stringify(await run(name)));
  await new Promise((r) => setTimeout(r, 4000)); // let the GPU/CPU settle between runs
}
