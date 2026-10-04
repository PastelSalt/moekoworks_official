// Flower confetti (plan §7.4): contact success, admin publish, clicking the logo flowers. Lazy-loaded; off in calm mode.
import { SHAPES } from "@/components/decor/shapes";
import { isCalm } from "./motion";

const COLORS = ["#FFB4E3", "#A0CFFC", "#E2A8F2", "#F8D95A", "#FFFFFF", "#F28AA9"];

export async function flowerBurst(from?: Element | null) {
  if (typeof window === "undefined" || isCalm()) return;
  const confetti = (await import("canvas-confetti")).default;
  let origin = { x: 0.5, y: 0.45 };
  if (from) {
    const r = from.getBoundingClientRect();
    origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
  }
  let shapes: confetti.Shape[] = ["circle", "square"];
  try {
    shapes = [confetti.shapeFromPath({ path: SHAPES.flower }), confetti.shapeFromPath({ path: SHAPES.heart }), "circle"];
  } catch {
    /* older browsers: default shapes */
  }
  confetti({ particleCount: 70, spread: 80, startVelocity: 38, origin, ticks: 230, scalar: 1.25, colors: COLORS, shapes, disableForReducedMotion: true });
}
