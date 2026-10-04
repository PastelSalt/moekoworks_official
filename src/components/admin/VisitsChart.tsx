"use client";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useMemo, useState } from "react";

type Point = { day: string; visits: number; uniques: number };
type Mode = "daily" | "weekly" | "monthly";

/** kotoha-style visits chart: an outer bar for visits with an inner bar for unique visitors (counted per day). */
export function VisitsChart({ series, range }: { series: Point[]; range: number }) {
  const [mode, setMode] = useState<Mode>(range > 90 ? "weekly" : "daily");

  const bars = useMemo(() => {
    // fill every Manila day in the range so gaps show as empty days
    const byDay = new Map(series.map((p) => [p.day, p]));
    const today = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()) + "T00:00:00Z");
    const days: Point[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      days.push(byDay.get(d) ?? { day: d, visits: 0, uniques: 0 });
    }
    if (mode === "daily") return days.map((p) => ({ label: p.day.slice(5).replace("-", "/"), title: p.day, ...p }));
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
      const g = groups.get(key) ?? { day: key, label, title: mode === "weekly" ? `Week of ${key}` : key, visits: 0, uniques: 0 };
      g.visits += p.visits;
      g.uniques += p.uniques;
      groups.set(key, g);
    }
    return [...groups.values()];
  }, [series, range, mode]);

  const max = Math.max(1, ...bars.map((b) => b.visits));
  const W = 720;
  const H = 220;
  const pad = { l: 34, r: 8, t: 10, b: 26 };
  const bw = (W - pad.l - pad.r) / bars.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max];
  const every = Math.ceil(bars.length / 10);

  return (
    <div className="vchart">
      <div className="vchart__head">
        <p className="admin-label">Visits</p>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)} aria-label="Group by">
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
          <ToggleButton value="monthly">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="vchart__svg" role="img" aria-label={`Visits and unique visitors, ${mode}`}>
        {ticks.map((t) => (
          <g key={t}>
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
          return (
            <g key={b.day}>
              <title>{`${b.title}: ${b.visits} visit${b.visits === 1 ? "" : "s"}, ${b.uniques} unique (counted per day)`}</title>
              <rect x={x + (bw - w) / 2} y={y(b.visits)} width={w} height={H - pad.b - y(b.visits)} rx={Math.min(6, w / 2)} className="vchart__outer" />
              <rect x={x + (bw - iw) / 2} y={y(b.uniques)} width={iw} height={H - pad.b - y(b.uniques)} rx={Math.min(4, iw / 2)} className="vchart__inner" />
              {i % every === 0 ? (
                <text x={x + bw / 2} y={H - 8} className="vchart__tick" textAnchor="middle">
                  {b.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="vchart__legend">
        <span className="vchart__key vchart__key--outer" /> Visits <span className="vchart__key vchart__key--inner" /> Unique visitors (counted per day)
      </p>
    </div>
  );
}
