"use client";

import { ChartColumn } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Point = { day: string; visits: number; uniques: number };
type Mode = "daily" | "weekly" | "monthly";
type Bar = { key: string; visits: number; uniques: number };

const nf = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const plural = (n: number, w: string) => `${nf.format(n)} ${w}${n === 1 ? "" : "s"}`;

function shortLabel(mode: Mode, key: string) {
  if (mode === "monthly") return new Date(`${key}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const [, m, d] = key.split("-").map(Number);
  return `${m}/${d}`;
}
function longLabel(mode: Mode, key: string) {
  if (mode === "monthly") return new Date(`${key}-01T00:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const s = new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: mode === "daily" ? "short" : undefined, day: "numeric", month: "short", timeZone: "UTC" });
  return mode === "weekly" ? `Week of ${s}` : s;
}

/** Kotoha visits chart: light bars = visits, dark bars = unique visitors (counted per day), drawn at the box's real
 *  width so the tick text stays 11px on every screen. Hover, tap or ←/→ (box focused) show one period's values. */
export function VisitsChart({ series, range }: { series: Point[]; range: number }) {
  const [mode, setMode] = useState<Mode>(range > 90 ? "weekly" : "daily");
  const [active, setActive] = useState(-1);
  const [width, setWidth] = useState(720);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    setWidth(Math.max(300, Math.round(node.clientWidth)));
    const obs = new ResizeObserver(() => setWidth((w) => (Math.abs(node.clientWidth - w) > 30 ? Math.max(300, Math.round(node.clientWidth)) : w)));
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const bars = useMemo<Bar[]>(() => {
    // every Manila day in the range, so quiet days show as gaps
    const byDay = new Map(series.map((p) => [p.day, p]));
    const today = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()) + "T00:00:00Z");
    const days: Bar[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      const p = byDay.get(d);
      days.push({ key: d, visits: p?.visits ?? 0, uniques: p?.uniques ?? 0 });
    }
    if (mode === "daily") return days;
    const groups = new Map<string, Bar>();
    for (const p of days) {
      const d = new Date(`${p.key}T00:00:00Z`);
      const key = mode === "weekly" ? new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10) : p.key.slice(0, 7);
      const g = groups.get(key) ?? { key, visits: 0, uniques: 0 };
      g.visits += p.visits;
      g.uniques += p.uniques;
      groups.set(key, g);
    }
    return [...groups.values()];
  }, [series, range, mode]);

  const W = width;
  const H = W < 480 ? 200 : 240;
  const padL = 40;
  const padB = 26;
  const padT = 12;
  const max = Math.max(1, ...bars.map((b) => b.visits));
  const step = (W - padL) / bars.length;
  const barW = Math.max(3, step * 0.68);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const labelEvery = mode === "daily" ? (W < 480 ? 7 : 5) : W < 480 ? 3 : 1;
  const totals = bars.reduce((t, b) => ({ visits: t.visits + b.visits, uniques: t.uniques + b.uniques }), { visits: 0, uniques: 0 });
  const shown = active >= 0 && active < bars.length ? bars[active] : null;
  const pct = shown ? (padL + active * step + step / 2) / W : 0;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a < 0 ? bars.length : a) - 1));
    else setActive((a) => Math.min(bars.length - 1, a + 1));
  };

  return (
    <div className="vchart">
      <div className="panel__head">
        <div>
          <h2>
            <ChartColumn aria-hidden />
            <span>Visits</span>
          </h2>
          <p className="panel__total">
            {plural(totals.visits, "visit")} · {nf.format(totals.uniques)} unique visitors in the shown period
          </p>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Group visits by">
          {(["daily", "weekly", "monthly"] as Mode[]).map((m) => (
            <label key={m} className="segmented__item">
              <input type="radio" name="vchart-mode" value={m} checked={mode === m} onChange={() => (setMode(m), setActive(-1))} />
              <span>{m[0].toUpperCase() + m.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>
      <div
        ref={box}
        className="chart-box"
        tabIndex={0}
        aria-label="Visits chart. Use the left and right arrow keys to read each period."
        onKeyDown={onKey}
        onFocus={() => setActive((a) => (a < 0 ? bars.length - 1 : a))}
        onBlur={() => setActive(-1)}
        onPointerLeave={() => setActive(-1)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="chart" role="img" aria-label={`Visits and unique visitors, ${mode}`}>
          {[0.5, 1].map((f) => (
            <g key={f} aria-hidden="true">
              <line x1={padL} x2={W} y1={y(max * f)} y2={y(max * f)} className="chart__grid" />
              <text x={padL - 8} y={y(max * f) + 4} textAnchor="end" className="chart__tick">
                {compact.format(Math.round(max * f))}
              </text>
            </g>
          ))}
          <line x1={padL} x2={W} y1={y(0)} y2={y(0)} className="chart__axis" />
          <text x={padL - 8} y={y(0) + 4} textAnchor="end" className="chart__tick">
            0
          </text>
          {bars.map((b, i) => {
            const x = padL + i * step + (step - barW) / 2;
            const last = i === bars.length - 1;
            return (
              <g key={b.key} className={`chart__col${i === active ? " is-active" : ""}`} onPointerEnter={() => setActive(i)} onClick={() => setActive(i)}>
                <title>{`${longLabel(mode, b.key)}: ${plural(b.visits, "visit")} · ${plural(b.uniques, "unique visitor")}`}</title>
                <rect x={padL + i * step} y={padT} width={step} height={H - padT - padB} rx={6} className="chart__bg" />
                <rect x={x} y={y(b.visits)} width={barW} height={Math.max(0, y(0) - y(b.visits))} rx={3} className="chart__bar" />
                <rect x={x + barW * 0.2} y={y(b.uniques)} width={barW * 0.6} height={Math.max(0, y(0) - y(b.uniques))} rx={2} className="chart__bar chart__bar--inner" />
                <rect x={padL + i * step} y={0} width={step} height={H} className="chart__hit" />
                {(bars.length - 1 - i) % labelEvery === 0 ? (
                  <text x={last ? W : padL + i * step + step / 2} y={H - 6} textAnchor={last ? "end" : "middle"} className="chart__tick" aria-hidden="true">
                    {shortLabel(mode, b.key)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {shown ? (
          <div
            className="chart-tip"
            aria-live="polite"
            style={{
              left: `${pct * 100}%`,
              top: `${(y(shown.visits) / H) * 100}%`,
              translate: `${pct < 0.18 ? "-12%" : pct > 0.82 ? "-88%" : "-50%"} calc(-100% - 8px)`,
            }}
          >
            <strong>{longLabel(mode, shown.key)}</strong> {plural(shown.visits, "visit")} · {plural(shown.uniques, "unique visitor")}
          </div>
        ) : null}
      </div>
      <p className="chart-legend">
        <span>
          <i className="chart-legend__key" /> Visits
        </span>
        <span>
          <i className="chart-legend__key chart-legend__key--inner" /> Unique visitors (counted per day)
        </span>
      </p>
    </div>
  );
}
