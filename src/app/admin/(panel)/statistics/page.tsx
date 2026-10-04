import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { VisitsChart } from "@/components/admin/VisitsChart";
import { getStats, type Item, type Range, RANGES } from "@/server/admin/stats";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Statistics" };

const pct = (x: number) => `${Math.round(x * 100)}%`;
const dur = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`);

function Card({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <Paper elevation={0} className={`scard ${wide ? "scard--wide" : ""}`} sx={{ boxShadow: "var(--shadow-paper)" }}>
      <p className="admin-label">{title}</p>
      {children}
    </Paper>
  );
}

function Bars({ list, unit = "", empty = "No data yet", extra }: { list: Item[]; unit?: string; empty?: string; extra?: (i: Item) => string }) {
  if (!list.length) return <p className="scard__empty">{empty}</p>;
  const max = Math.max(...list.map((i) => i.value), 1);
  return (
    <ul className="bars">
      {list.map((i) => (
        <li key={i.key}>
          <span className="bars__label" title={i.label}>
            {i.label}
          </span>
          <span className="bars__track" aria-hidden="true">
            <span style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
          <span className="bars__value">
            {i.value}
            {unit}
            {extra ? <small> · {extra(i)}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function StatisticsPage({ searchParams }: PageProps<"/admin/statistics">) {
  await requireAdmin();
  const sp = await searchParams;
  const range = (RANGES.find((r) => String(r) === sp.range) ?? 30) as Range;
  const allEnv = sp.env === "all";
  const s = await getStats(range, allEnv);
  const link = (p: { range?: Range; env?: string }) => {
    const params = new URLSearchParams();
    const r = p.range ?? range;
    if (r !== 30) params.set("range", String(r));
    const e = p.env ?? (allEnv ? "all" : "");
    if (e) params.set("env", e);
    const str = params.toString();
    return `/admin/statistics${str ? `?${str}` : ""}`;
  };
  const tiles = [
    { label: "Today", value: s.kpi.today[0], sub: `${s.kpi.today[1]} unique` },
    { label: "This week", value: s.kpi.week[0], sub: `${s.kpi.week[1]} unique (per day)` },
    { label: "This month", value: s.kpi.month[0], sub: `${s.kpi.month[1]} unique (per day)` },
    { label: "Avg. visit length", value: s.kpi.avgVisitMs ? dur(s.kpi.avgVisitMs) : "—", sub: "visible time, capped at 30 min" },
    { label: "Avg. loading time", value: s.kpi.avgLoadMs ? dur(s.kpi.avgLoadMs) : "—", sub: "splash screen" },
    { label: "Unread messages", value: s.kpi.unread, sub: "now", href: "/admin/messages" },
    { label: "Messages", value: s.kpi.messagesInRange, sub: `last ${range} days`, href: "/admin/messages" },
  ];
  const f = s.funnel;
  const maxHour = Math.max(1, ...s.hours);

  return (
    <>
      <p className="admin-label">No.04 — Statistics</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Statistics
      </Typography>

      <div className="stoolbar">
        <nav className="admin-tabs" aria-label="Range">
          {RANGES.map((r) => (
            <Link key={r} href={link({ range: r })} className="admin-tab" aria-current={r === range ? "page" : undefined}>
              {r === 365 ? "1 year" : `${r} days`}
            </Link>
          ))}
        </nav>
        <span className="admin-label">
          {s.kpi.visitsInRange} visit{s.kpi.visitsInRange === 1 ? "" : "s"} in this period
        </span>
        <Link href={link({ env: allEnv ? "" : "all" })} className="admin-tab" aria-pressed={allEnv}>
          {allEnv ? "✓ " : ""}Include previews & dev
        </Link>
        {range !== 365 ? (
          <Button component="a" href={`/admin/statistics/export?range=${range}${allEnv ? "&env=all" : ""}`} variant="outlined" color="secondary" size="small" startIcon={<Download size={16} aria-hidden />}>
            Export CSV
          </Button>
        ) : null}
      </div>
      {range === 365 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          The 1-year view uses the nightly daily totals (production only), so today and yesterday may not be included yet.
        </Alert>
      ) : null}

      <div className="stiles">
        {tiles.map((t) => (
          <Paper key={t.label} elevation={0} className="stile" sx={{ boxShadow: "var(--shadow-paper)" }}>
            <p className="admin-label">{t.label}</p>
            <p className="stile__value">{t.href ? <Link href={t.href}>{t.value}</Link> : t.value}</p>
            <p className="stile__sub">{t.sub}</p>
          </Paper>
        ))}
      </div>

      <Paper elevation={0} sx={{ p: 2.5, my: 2, boxShadow: "var(--shadow-paper)" }}>
        <VisitsChart series={s.series} range={range} />
      </Paper>

      <div className="sgrid">
        <Card title="Pages">
          <Bars list={s.pages} extra={(i) => `avg ${dur((i as Item & { avgMs: number }).avgMs)}`} />
        </Card>
        <Card title="Home sections">
          <Bars list={s.sections.map((x) => ({ ...x, value: Math.round(x.reach * 100) }))} unit="%" extra={(i) => `avg ${dur(s.sections.find((x) => x.key === i.key)?.avgMs ?? 0)}`} empty="No Home visits yet" />
        </Card>
        <Card title="Top projects" wide>
          {s.projects.length ? (
            <table className="stable">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Views</th>
                  <th>Video plays</th>
                  <th>Link clicks</th>
                  <th>CTR</th>
                  <th>Image opens</th>
                </tr>
              </thead>
              <tbody>
                {s.projects.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.views}</td>
                    <td>{p.plays}</td>
                    <td>{p.clicks}</td>
                    <td>{pct(p.ctr)}</td>
                    <td>{p.images}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="scard__empty">No project views yet</p>
          )}
        </Card>
        <Card title="Link clicks by type">
          <Bars list={s.linkKinds} />
        </Card>
        <Card title="Video plays">
          <Bars list={s.video.plays} />
          {s.video.plays.length ? <p className="scard__note">Completion: {pct(s.video.completion)}</p> : null}
        </Card>
        <Card title="Certificates viewed">
          <Bars list={s.certificates} empty={range === 365 ? "Shown for ranges up to 90 days" : "No certificate views yet"} />
        </Card>
        <Card title="Contact funnel">
          <ul className="funnel">
            <li>
              <span>Contact page visits</span>
              <strong>{f.visits}</strong>
            </li>
            <li>
              <span>Started the form</span>
              <strong>{f.starts}</strong>
            </li>
            <li>
              <span>Messages sent</span>
              <strong>{f.sent}</strong>
            </li>
            <li>
              <span>Conversion</span>
              <strong>{f.visits ? pct(f.sent / f.visits) : "—"}</strong>
            </li>
          </ul>
        </Card>
        <Card title="Social & e-mail clicks">
          <Bars list={s.social} />
        </Card>
        <Card title="Sources">
          <Bars list={s.sources} empty="No referrers yet (direct visits only)" />
          {s.campaigns.length ? (
            <>
              <p className="admin-label" style={{ marginTop: 14 }}>
                Campaigns (utm / ref)
              </p>
              <Bars list={s.campaigns} />
            </>
          ) : null}
        </Card>
        <Card title="Countries">
          <Bars list={s.countries} />
          {s.countries.length ? <p className="scard__note">{pct(s.phShare)} from the Philippines</p> : null}
        </Card>
        <Card title="Devices">
          <Bars list={s.devices} />
        </Card>
        <Card title="Browsers & OS">
          <Bars list={s.browsers} />
          <p className="admin-label" style={{ marginTop: 14 }}>
            Operating systems
          </p>
          <Bars list={s.os} />
        </Card>
        <Card title="Browser languages">
          <Bars list={s.languages} />
        </Card>
        <Card title="Busiest hours (PH time)" wide>
          <div className="hours" role="img" aria-label="Page views by hour of day, Philippine time">
            {s.hours.map((v, h) => (
              <span key={h} className="hours__bar" title={`${String(h).padStart(2, "0")}:00 · ${v} views`}>
                <span style={{ height: `${(v / maxHour) * 100}%` }} />
                <small>{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</small>
              </span>
            ))}
          </div>
        </Card>
        <Card title="Motion preference">
          <p className="stile__value">{pct(s.motionOffShare)}</p>
          <p className="scard__note">of visits turned motion off</p>
        </Card>
        <Card title="Not found (404)">
          <Bars list={s.notFound} empty="No broken links ✿" />
        </Card>
      </div>

      <p className="admin-hint" style={{ marginTop: 20 }}>
        No cookies are used and no IP addresses are stored. Signed-in admin browsers, bots and preview sites are not counted. Detailed records are kept for 90 days; daily totals are kept.
      </p>
    </>
  );
}
