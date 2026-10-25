"use client";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

type Point = { day: string; visits: number; uniques: number };
type Mode = "daily" | "weekly" | "monthly";

const NARROW = "(max-width: 600px)";
function useNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(NARROW);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** kotoha-style visits chart: an outer bar for visits with an inner bar for unique visitors (counted per day).
 *  Hover, tap or focus a bar (←/→ to move) to read its values. `compact` = the Dashboard's small 7-day version. */
export function VisitsChart({ series, range, compact = false }: { series: Point[]; range: number; compact?: boolean }) {
  const [mode, setMode] = useState<Mode>(range > 90 ? "weekly" : "daily");
  const [active, setActive] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(-1);
  const svgRef = useRef<SVGSVGElement>(null);
  const narrow = useNarrow();

  const bars = useMemo(() => {
    // fill every Manila day in the range so gaps show as empty days
    const byDay = new Map(series.map((p) => [p.day, p]));
    const today = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()) + "T00:00:00Z");
    const days: Point[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      days.push(byDay.get(d) ?? { day: d, visits: 0, uniques: 0 });
    }
    const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    if (mode === "daily") return days.map((p) => ({ label: p.day.slice(5).replace("-", "/"), title: fmtDay(p.day), ...p }));
    const groups = new Map<string, Point & { label: string; title: string }>();
    for (const p of days) {
      const d = new Date(`${p.day}T00:00:00Z`);
      let key: string;
      let label: string;
      if (mode === "weekly") {
        const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
        key = monday;
        label = monday.slice(5).replace("-", "/");
      } else {
        key = p.day.slice(0, 7);
        label = new Date(`${key}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      }
      const title = mode === "weekly" ? `Week of ${fmtDay(key)}` : new Date(`${key}-01T00:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
      const g = groups.get(key) ?? { day: key, label, title, visits: 0, uniques: 0 };
      g.visits += p.visits;
      g.uniques += p.uniques;
      groups.set(key, g);
    }
    return [...groups.values()];
  }, [series, range, mode]);

  const totals = bars.reduce((t, b) => ({ visits: t.visits + b.visits, uniques: t.uniques + b.uniques }), { visits: 0, uniques: 0 });
  const max = Math.max(1, ...bars.map((b) => b.visits));
  const W = 720;
  const H = compact ? 170 : narrow ? 240 : 260;
  const pad = { l: 34, r: 8, t: 12, b: 26 };
  const bw = (W - pad.l - pad.r) / bars.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [...new Set([0, Math.round(max / 2), max])];
  const every = narrow ? (mode === "daily" && bars.length > 10 ? 7 : Math.ceil(bars.length / 5)) : Math.ceil(bars.length / 10);
  const tab = focusIdx >= 0 && focusIdx < bars.length ? focusIdx : bars.length - 1;
  const shown = active !== null && active < bars.length ? bars[active] : null;

  const focusBar = (i: number) => {
    const j = Math.max(0, Math.min(bars.length - 1, i));
    setFocusIdx(j);
    setActive(j);
    svgRef.current?.querySelector<SVGGElement>(`[data-i="${j}"]`)?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const next = { ArrowRight: tab + 1, ArrowLeft: tab - 1, Home: 0, End: bars.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    focusBar(next);
  };

  return (
    <div className={`vchart${compact ? " vchart--compact" : ""}`}>
      <div className="vchart__head">
        <div>
          {compact ? null : <p className="admin-label">Visits</p>}
          <p className="vchart__total">
            <strong>{totals.visits}</strong> {totals.visits === 1 ? "visit" : "visits"} · <strong>{totals.uniques}</strong> unique <span>(counted per day)</span>
          </p>
        </div>
        <p className="vchart__legend">
          <span className="vchart__key vchart__key--outer" /> Visits <span className="vchart__key vchart__key--inner" /> Unique
        </p>
        {compact ? null : (
          <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && (setMode(v), setActive(null), setFocusIdx(-1))} aria-label="Group by">
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        )}
      </div>
      <div className="vchart__plot" onMouseLeave={() => setActive(null)}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="vchart__svg" role="group" aria-label={`Visits and unique visitors, ${mode}. Use the arrow keys to move between bars.`} onKeyDown={onKey}>
          {ticks.map((t) => (
            <g key={t} aria-hidden="true">
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="vchart__grid" />
              <text x={pad.l - 6} y={y(t) + 4} className="vchart__tick" textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const x = pad.l + i * bw;
            const w = Math.max(2, bw * 0.72);
            const iw = Math.max(1.5, w * 0.45);
            const label = `${b.title}: ${plural(b.visits, "visit")}, ${b.uniques} unique`;
            return (
              <g
                key={b.day}
                data-i={i}
                className={`vchart__bar${active === i ? " is-active" : ""}`}
                tabIndex={i === tab ? 0 : -1}
                role="img"
                aria-label={label}
                onMouseEnter={() => setActive(i)}
                onFocus={() => (setActive(i), setFocusIdx(i))}
                onBlur={() => setActive(null)}
                onClick={() => setActive(i)}
              >
                <title>{label}</title>
                <rect x={x} y={pad.t} width={bw} height={H - pad.t - pad.b} className="vchart__hit" />
                <rect x={x + (bw - w) / 2} y={y(b.visits)} width={w} height={H - pad.b - y(b.visits)} rx={Math.min(6, w / 2)} className="vchart__outer" />
                <rect x={x + (bw - iw) / 2} y={y(b.uniques)} width={iw} height={H - pad.b - y(b.uniques)} rx={Math.min(4, iw / 2)} className="vchart__inner" />
                {i % every === 0 || (compact && bars.length <= 10) ? (
                  <text x={x + bw / 2} y={H - 8} className="vchart__tick" textAnchor="middle" aria-hidden="true">
                    {b.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {shown && active !== null ? (
          <div
            className="vchart__tip"
            aria-hidden="true"
            data-side={active > bars.length / 2 ? "left" : "right"}
            style={{ "--x": `${((pad.l + (active + 0.5) * bw) / W) * 100}%`, "--y": `${(y(shown.visits) / H) * 100}%` } as React.CSSProperties}
          >
            <strong>{shown.title}</strong>
            <span>{plural(shown.visits, "visit")}</span>
            <span>{shown.uniques} unique</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
