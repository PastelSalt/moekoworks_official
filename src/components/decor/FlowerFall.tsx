// Outline flowers drifting down behind the page (owner request 2026-10-11): a fixed layer under all content, so it
// only shows on the bare canvas between sections. Pure CSS (motion.css); calm mode leaves them scattered and still.
import type { CSSProperties } from "react";
import { FLOWER_VIEWBOX, SHAPES } from "./shapes";

const COUNT = 26;
const STROKES = ["var(--pink-300)", "var(--lilac-300)", "var(--blue-300)", "var(--pink-400)", "var(--butter-300)"];

/** Deterministic 0…1 noise per flower (same markup on server and client, no Math.random in render). */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const FLOWERS = Array.from({ length: COUNT }, (_, i) => {
  const size = Math.round(16 + rand(i, 1) * 30);
  const fall = 22 + rand(i, 2) * 20; // seconds top → bottom
  return {
    stroke: STROKES[i % STROKES.length],
    style: {
      "--x": `${((i + rand(i, 3)) / COUNT) * 100}%`,
      "--y": `${Math.round(rand(i, 4) * 100)}vh`,
      "--size": `${size}px`,
      "--fall": `${fall.toFixed(1)}s`,
      "--delay": `${(-rand(i, 5) * fall).toFixed(1)}s`,
      "--spin": `${(rand(i, 6) > 0.5 ? 1 : -1) * (0.6 + rand(i, 7) * 0.9)}turn`,
      "--sway": `${Math.round(14 + rand(i, 8) * 30)}px`,
      "--sway-t": `${(4 + rand(i, 9) * 4).toFixed(1)}s`,
      "--o": (0.35 + rand(i, 10) * 0.35).toFixed(2),
    } as CSSProperties,
  };
});

export function FlowerFall() {
  return (
    <div className="flowerfall" aria-hidden="true">
      {FLOWERS.map((f, i) => (
        <span key={i} className="flowerfall__item" style={f.style}>
          <span className="flowerfall__sway">
            <svg className="flowerfall__flower" viewBox={FLOWER_VIEWBOX} focusable="false">
              <path d={SHAPES.flower} fill="none" stroke={f.stroke} strokeWidth="1.3" strokeLinejoin="round" />
              <path d={SHAPES.flowerCentre} fill="none" stroke={f.stroke} strokeWidth="1.1" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
