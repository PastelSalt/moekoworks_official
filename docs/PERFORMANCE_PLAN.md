# PERFORMANCE_PLAN.md — making the motion smooth without removing anything

> Written 2026-10-14 after Kyle reported the site feels like ~20 fps on his own laptop.
> **Constraint (Kyle): nothing may be removed or changed visually. Every fix is in the code only:** same
> elements, same colours, same motion. Where a fix *could* be noticed (scroll feel, blur), it is listed as a
> separate decision for Kyle (§5), not done silently.
> Status: **plan only, no code changed yet.** Execute phase by phase after Kyle's OK; measure after each phase.

---

## 1. The device and what was measured

| | |
|---|---|
| Laptop | AMD Ryzen 3 3250U (2 cores / 4 threads), **Radeon Vega 3** integrated GPU, 13 GB RAM, Ubuntu 26.04: the same machine class as the Kotoha/Hanon performance passes |
| Harness | `scripts/perf/bench.mjs` (frame times while wheel-scrolling the whole page down and up, a fresh headless Chrome per run, real GPU through ANGLE/OpenGL, fine pointer emulated so **Lenis runs as on a real mouse/touchpad**) and `scripts/perf/trace.mjs` (main-thread work by category, layer count) |
| Page | Home at 1920×1080, production (`moesoft.vercel.app`, commit `f121c93`) |

**Results (2026-10-14).** The laptop was hot (73–78 °C) and Kyle's own Chrome was busy at the same time (one tab's
renderer at >100 % of a core, its GPU process at 100 %), so absolute numbers swing a lot between identical runs.
Read them as directions, not exact values:

| Run | fps | p95 frame | Notes |
|---|---|---|---|
| Full motion, Lenis **off** (first runs, cooler machine) | 27.6 / 28.3 | 50 ms | |
| **Calm mode** (every effect off) | **59.0** | 16.8 ms | the ceiling: the page itself is cheap, **the motion layer is the whole cost** |
| Falling flowers hidden (same session) | **44.8** | 33 ms | +60 % from one effect added on 2026-10-11 |
| Full motion, **Lenis on** (as on Kyle's laptop) | 8.7 – 26.2 | 50–216 ms | huge swings between identical runs |
| Lenis on, `--lean` writes stopped | 25.5 | 83 ms | next to baselines of 12.8 and 26.2 |
| Lenis on, falling flowers hidden | 13.2 | 133 ms | next to baselines of 9.1 and 12.8 |

Later isolation runs in one shared browser degraded steadily (down to ~3 fps), so they were thrown away and the
harness now starts a fresh browser per run and always closes it.

**Phase 0 must re-measure on a quiet machine** (§4) before and after every phase.

---

## 2. Where the time goes (code review + measurements)

Ranked by expected impact. "Visual change" says whether a visitor could notice the fix.

| # | Cause | Where | Why it is slow | Fix (same look) | Visual change |
|---|---|---|---|---|---|
| 1 | **`--lean` written on `<html>` every frame while scrolling**, and **nothing uses it any more** (no element has the `.lean` class) | `MotionRoot.tsx` (velocity effect), `motion.css` `.lean` | A custom property on the root is inherited by every element, so each write makes Chrome recalculate the style of the **whole document** every scroll frame. The Kotoha pass found exactly this ("never write a per-frame custom property on `<html>`") | Stop writing `--lean`; keep the smoothed velocity only for the marquees (§3 P1). Delete the unused `.lean` rules | **None** (nothing reads it) |
| 2 | **Falling flowers: 26 flowers × 3 nested animations = 78 running animations**, in a fixed layer **under** all content | `FlowerFall.tsx`, `motion.css` `.flowerfall*` | Every flower is 3 composited layers (fall, sway, spin). Because the layer sits *below* the page and keeps moving, Chrome must keep the content above it on separate layers (overlap), and it re-composites the whole screen every frame, even when idle. Hiding it alone took 28 → 45 fps | One element per flower carrying **one** animation: fall + sway + spin baked into a single keyframe list using the individual `translate` and `rotate` properties (identical path and timing). SVG drawn once (`<symbol>` + `<use>`) instead of 26 copies. Pause the layer while the tab is hidden and while the splash shows | **None** (same paths, sizes, speeds, colours) |
| 3 | **Lenis drives the scroll position from JavaScript** | `MotionRoot.tsx` (Lenis effect) | Each wheel step becomes ~60 JS-set scroll positions; every one fires the scroll listeners (lean loop, PageTop, marquee velocity). When the main thread is busy, the *scrolling itself* stutters. Native scrolling runs on the compositor thread and stays smooth even when scripts are slow | **Option A (no visible change):** keep Lenis, but make every scroll listener cheap (P1). **Option B:** native scrolling, like the Kotoha/Hanon sites since their performance pass. B changes the *feel* of the wheel, so **it is Kyle's decision (§5 D1)** | A: none · B: scroll feel only |
| 4 | **Marquees animated by a JavaScript loop every frame while on screen** | `Marquee.tsx` (Toolbox on Home, Built-with ribbon on project pages) | `requestAnimationFrame` writes `transform` every frame forever while visible, even when nothing else moves: main-thread work and a new frame every 16 ms | One looping **Web Animation** (`translate3d(0) → translate3d(-width)`) that runs on the compositor; scroll speed only calls `updatePlaybackRate()` (negative = reverse). Kotoha's proven approach | **None** (same speed, speed-up and reversal) |
| 5 | **PAGE TOP ring updated from a scroll handler** | `PageTop.tsx` | Reads `scrollHeight` and writes a style on every scrolled frame (layout read + style write) | Ring fill as a **CSS scroll-driven animation** (`animation-timeline: scroll(root)`), no JS; show/hide from an `IntersectionObserver` on a sentinel 60 % down the first screen; JS fallback only where scroll timelines aren't supported | **None** |
| 6 | **Loops keep running off screen** | `motion.css` (`.twinkle`, `.float`, `.bob`, `.badge__ring`, stage pattern drift + wash breathing) | Off-screen animations still tick and re-composite. The pattern-drift layer is huge (stage size + 960 px) | Sections more than one screen away get `.is-far` → `animation-play-state: paused` (IntersectionObserver, `rootMargin: 100%`). Kotoha used `animation: none`; **pausing** keeps the exact phase, so nothing jumps when it comes back | **None** (only off-screen things pause) |
| 7 | **Hover preview videos start while wheel-scrolling** | `PreviewVideo.tsx` (hover mode) | With the mouse resting still, cards scrolling *under* the pointer fire `pointerenter` → each starts downloading and decoding video mid-scroll | Start only after the pointer really moves over the card, or after scrolling has been idle for 150 ms; intentional hovering behaves exactly as now | **None** for real hovering |
| 8 | **`backdrop-filter` blur** on surfaces over moving content | `.hero__copy` (blur 6px), project page sticky `.pbar` (blur 12px), phone top bar `.mbar` (blur 14px), lightbox backdrop | The blur of whatever is behind is recomputed every frame something behind moves (the drifting pattern, falling flowers, scrolling content). The single most expensive effect in the Kotoha pass | Code-only part: none safe. A solid fill of the same tint looks *almost* identical, but that is a visual change → **Kyle's decision (§5 D2)** | D2 only |
| 9 | Several `will-change` / promotion hints | `.flowerfall__item`, `.sparkle-layer svg`, `.marquee__track`, `.splash__logo` | Permanent layers use GPU memory on a 2 GB-shared iGPU | Keep only where an animation is running (set by the animation itself); drop the permanent hints after P2/P4 | None |
| 10 | Filters on animated/large elements | `.hero__logo` (`drop-shadow` on a 105-path SVG), stickers, badge | Re-rasterised when their layer changes scale/rotation | Measure in P3; if costly, bake the shadow into the SVG / a pre-rendered image with the identical look | None (pixel-identical result) |

What is **fine** and stays as is: the 30 CSS scroll-driven `.reveal` animations (compositor-only, `opacity` +
`transform`), the cursor sparkles (pooled Web Animations, desktop only), the letter pops (one-shot), the splash.

---

## 3. The plan

Each phase: implement → `npm run typecheck && npm run lint && npm run build` → **measure (§4)** →
before/after screenshots (§4.3) → commit on `dev`. Merge to `main` only with Kyle's OK.

### P0 — Quiet baseline (½ h)
1. Kyle closes the other browser tabs (especially moesoft.vercel.app) and plugs the laptop in.
2. `npm run build && npx next start -p 3200`, then for Home, `/history`, `/history/hanon-fansite`, `/about`:
   `node scripts/perf/bench.mjs http://localhost:3200/<page> base,calm,base,calm,base 1920 1080` and the same at
   `1366 768 4` (4× CPU slowdown); `node scripts/perf/trace.mjs http://localhost:3200/` for the main-thread split
   and layer count. Also **idle cost**: CPU time of an untouched page over 10 s (renderer + GPU process).
3. Record the medians in §6.

### P1 — Per-frame JavaScript (biggest, safest win)
1. `MotionRoot.tsx`: delete the `--lean` writes; keep the smoothed velocity (`setScrollVelocity`) for the marquees.
   Remove the unused `.lean` rules from `motion.css`.
2. One scroll ticker for everything that still needs scroll speed (the marquees): one rAF loop that runs only while
   scrolling + 150 ms, never on its own.
3. `Marquee.tsx` → one compositor Web Animation per marquee; velocity only changes `playbackRate`; paused while off
   screen, while the tab is hidden and in calm mode (as now).
4. `PageTop.tsx` → CSS scroll-driven ring + IntersectionObserver for showing; keep `scrollToY` on click.
5. Measure. Expected: style-recalc time during scroll drops to near zero; the Lenis runs stop collapsing.

### P2 — Falling flowers, same look, a fraction of the cost
1. One `<svg><symbol id="ff-flower">` + 26 `<use>` (or one CSS `mask`/background with the same outline), one element
   per flower, **one** `@keyframes` per flower variant combining fall + sway + spin via `translate` and `rotate`
   (generated in `FlowerFall.tsx` from the same deterministic values, so paths, sizes, speeds and phases match).
2. Contain the layer (`contain: strict` stays) and isolate the page content above it in **one** stacking layer, so
   Chrome doesn't have to split the content into many layers for overlap.
3. Pause while hidden (`document.hidden`) and while the splash is showing.
4. Measure layers before/after with `trace.mjs` (expect ~78 fewer animations, far fewer layers).

### P3 — Off-screen pausing and leftovers
1. `.is-far` IntersectionObserver in `MotionRoot` for sections and the stage: `animation-play-state: paused`.
2. Hover videos: start only on real pointer movement or after scroll idle (§2 #7).
3. Filters on the hero logo/stickers: measure; bake into the asset only if it's a real cost.
4. `will-change` audit.

### P4 — Scrolling (only after Kyle decides D1)
- **A (default, no visible change):** keep Lenis; re-measure after P1–P3. If scrolling still stutters, tune `lerp`
  and stop Lenis while the main thread is busy.
- **B:** native scrolling everywhere (Kotoha/Hanon), `scrollToY` keeps smooth in-page jumps.

### P5 — Verify and ship
1. Every page at 1920/1366/390 in full and calm mode: screenshots with animations paused at the same time must be
   pixel-identical before/after (except the flowers' positions, compared with a fixed `animation-delay`).
2. Behaviour: marquee speeds up and reverses with scroll, PAGE TOP ring fills and the button appears after the
   first screen, flowers fall/sway/turn, hover videos still play on hover, calm mode still stops everything.
3. Commit, push `dev`, Kyle checks on his laptop, then `main`.

---

## 4. Measuring properly (lessons from this session)

1. **Quiet machine:** close other tabs; the site open in another tab costs a full core even when idle.
2. **Fresh browser per run, always closed** (`bench.mjs` does this). A leftover headless browser keeps animating.
3. **A/B pairs back to back** (`base,exp,base,exp,…`), 3+ pairs, **medians**; ±30 % swings on this laptop are normal.
4. Prefer `trace.mjs` numbers (style/layout/paint milliseconds, layer count) for decisions: they hold up even when
   the machine is busy; fps is the final check.
5. Never measure while the laptop is above ~75 °C (`cat /sys/class/thermal/thermal_zone0/temp`, m°C).
6. Statistics stay clean: the scripts set `ms_nt=1` and answer `/api/track` locally.

## 5. Decisions for Kyle

| # | Question | Recommendation | Confidence |
|---|---|---|---|
| D1 | Keep Lenis smooth scrolling (A) or switch to native scrolling like Kotoha/Hanon (B)? | **A first**, decide after P1–P3 are measured; B only if scrolling still stutters | medium (~70 %) |
| D2 | Replace the blurs (`backdrop-filter`) with solid tinted fills of the same colour? Barely visible, but technically a visual change | **No for now** (your rule); revisit only if P1–P3 aren't enough | high (~85 %) |
| D3 | OK to pause animations that are more than one screen away (they look identical when they come back)? | **Yes** | high (~90 %) |

## 6. Targets and results

| Metric (Home, 1920×1080, this laptop, quiet) | Now | Target |
|---|---|---|
| Scroll fps, Lenis on | 9–26 (noisy) | **≥ 50** |
| p95 frame time | 50–216 ms | ≤ 33 ms |
| Calm mode fps (ceiling) | 59 | unchanged |
| Running animations when idle | ≥ 78 (flowers) + loops + marquee | ≤ 30, all compositor-only |
| Idle CPU (page untouched, 10 s) | to measure (P0) | ≤ 10 % of one core |
| Visual difference | — | **none** |

_(Fill in after each phase.)_
