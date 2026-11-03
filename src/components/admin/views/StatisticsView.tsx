import {
  Accessibility,
  Award,
  Calendar,
  CalendarDays,
  CircleAlert,
  CirclePlay,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Languages,
  Layers,
  Link2,
  Loader,
  Mail,
  MapPin,
  MessageSquare,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
  Sun,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Item, Range, Stats } from "@/server/admin/stats";
import { AdminPageHead } from "../AdminPageHead";
import { KpiCard } from "../KpiCard";
import { RangeBar, RangeScope } from "../RangeScope";
import { StateBox } from "../StateBox";
import { VisitsChart } from "../VisitsChart";

const RANGES: Range[] = [7, 30, 90, 365];
const nf = new Intl.NumberFormat("en-US");
const pct = (x: number) => `${Math.round(x * 100)}%`;
const dur = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`);
const plural = (n: number, w: string) => `${nf.format(n)} ${w}${n === 1 ? "" : "s"}`;
const hh = (h: number) => String(h).padStart(2, "0");

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h3 className="group-title">
        <span>{title}</span>
      </h3>
      <div className="stat-grid">{children}</div>
    </>
  );
}

function Card({ title, icon: Icon, hint, wide = false, children }: { title: string; icon: LucideIcon; hint?: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={`panel panel--stat${wide ? " panel--wide" : ""}`}>
      <h2>
        <Icon aria-hidden />
        <span>{title}</span>
      </h2>
      {hint ? <p className="form-hint">{hint}</p> : null}
      {children}
    </section>
  );
}

/** Kotoha bar list: rank · label · value, the track on its own line under them, first row darker. */
function Bars({ list, unit = "", empty = "No data yet.", extra, tone = "content" }: { list: Item[]; unit?: string; empty?: string; extra?: (i: Item) => string; tone?: "content" | "visitors" }) {
  if (!list.length) return <StateBox small>{empty}</StateBox>;
  const max = Math.max(...list.map((i) => i.value), 1);
  return (
    <ol className={`bars bars--${tone}`}>
      {list.map((i, n) => (
        <li key={i.key} className="bars__row">
          <span className="bars__rank" aria-hidden="true">
            {n + 1}
          </span>
          <span className="bars__label" title={i.label}>
            {i.label}
          </span>
          <span className="bars__value">
            {nf.format(i.value)}
            {unit}
            {extra ? ` · ${extra(i)}` : ""}
          </span>
          <span className="bars__track" aria-hidden="true">
            <span className="bars__fill" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function Hours({ hours }: { hours: number[] }) {
  if (!hours.some((v) => v > 0)) return <StateBox small>No data yet.</StateBox>;
  const W = 300;
  const H = 120;
  const padB = 18;
  const max = Math.max(1, ...hours);
  const peak = hours.indexOf(max);
  const step = W / 24;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart chart--hours" role="img" aria-label={`Visits by hour of day, PH time. Busiest: ${hh(peak)}:00 with ${plural(max, "visit")}.`}>
        {hours.map((v, i) => {
          const bh = (H - padB - 4) * (v / max);
          return (
            <g key={i}>
              <title>{`${hh(i)}:00–${hh(i)}:59 · ${plural(v, "visit")}`}</title>
              <rect x={i * step + 1.5} y={H - padB - bh} width={step - 3} height={Math.max(bh, 1)} rx={2} className={`chart__bar chart__bar--inner${i === peak ? " chart__bar--peak" : ""}`} />
              {i % 6 === 0 ? (
                <text x={i * step + step / 2} y={H - 4} textAnchor="middle" className="chart__tick">
                  {i}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="chart-note">
        Busiest: {hh(peak)}:00–{hh((peak + 1) % 24)}:00 · {plural(max, "visit")}
      </p>
    </div>
  );
}

export function StatisticsView({ s, range, allEnv }: { s: Stats; range: Range; allEnv: boolean }) {
  const link = (p: { range?: Range; env?: string }) => {
    const params = new URLSearchParams();
    const r = p.range ?? range;
    if (r !== 30) params.set("range", String(r));
    const e = p.env ?? (allEnv ? "all" : "");
    if (e) params.set("env", e);
    const str = params.toString();
    return `/admin/statistics${str ? `?${str}` : ""}`;
  };
  const k = s.kpi;
  const f = s.funnel;
  const inRange = `last ${range === 365 ? "year" : `${range} days`}`;

  return (
    <>
      <AdminPageHead
        href="/admin/statistics"
        hint="Visits to the live site, counted in PH time (weeks start on Monday)."
        actions={
          <>
            {k.unread ? (
              <Link href="/admin/messages" className="apill apill--messages">
                <Mail aria-hidden /> {nf.format(k.unread)} unread now
              </Link>
            ) : null}
            <Link href={link({ env: allEnv ? "" : "all" })} className={`abtn abtn--sm ${allEnv ? "abtn--primary" : "abtn--ghost"}`} aria-pressed={allEnv}>
              {allEnv ? "✓ " : ""}Include previews & dev
            </Link>
            {range !== 365 ? (
              <a className="abtn abtn--ghost abtn--sm" href={`/admin/statistics/export?range=${range}${allEnv ? "&env=all" : ""}`}>
                <Download aria-hidden /> Export CSV
              </a>
            ) : null}
          </>
        }
      />

      <div className="kpis">
        <KpiCard icon={Sun} label="Today" value={nf.format(k.today[0])} sub={plural(k.today[1], "unique visitor")} />
        <KpiCard icon={CalendarDays} label="This week" value={nf.format(k.week[0])} sub={`${plural(k.week[1], "unique visitor")} (per day)`} />
        <KpiCard icon={Calendar} label="This month" value={nf.format(k.month[0])} sub={`${plural(k.month[1], "unique visitor")} (per day)`} />
      </div>

      <RangeScope>
        <RangeBar options={RANGES.map((r) => ({ href: link({ range: r }), label: r === 365 ? "1 year" : `${r} days`, active: r === range }))} note={`${plural(k.visitsInRange, "visit")} in this period`} />
        {range === 365 ? <p className="note-box">The 1-year view uses the nightly daily totals (production only), so today and yesterday may not be included yet.</p> : null}
        <section className="panel">
          <VisitsChart key={range} series={s.series} range={range} />
        </section>
        <div className="kpis kpis--range">
          <KpiCard small tone="content" icon={Timer} label="Average visit length" value={k.avgVisitMs ? dur(k.avgVisitMs) : "—"} sub={`${inRange} · visible time, capped at 30 min`} />
          <KpiCard small tone="content" icon={Loader} label="Average loading time" value={k.avgLoadMs ? dur(k.avgLoadMs) : "—"} sub={`${inRange} · splash screen`} />
          <KpiCard small tone="messages" icon={MessageSquare} label="Messages received" value={nf.format(k.messagesInRange)} sub={inRange} href="/admin/messages" />
        </div>

        <Group title="Audience">
          <Card title="Countries" icon={MapPin}>
            {s.countries.length ? <p className="form-hint bars-lead">{pct(s.phShare)} of visits came from the Philippines.</p> : null}
            <Bars list={s.countries} tone="visitors" />
          </Card>
          <Card title="Devices" icon={Smartphone}>
            <Bars list={s.devices} tone="visitors" />
          </Card>
          <Card title="Browsers & OS" icon={Globe}>
            <Bars list={s.browsers} tone="visitors" />
            <p className="sub-title">Operating systems</p>
            <Bars list={s.os} tone="visitors" />
          </Card>
          <Card title="Browser languages" icon={Languages}>
            <Bars list={s.languages} tone="visitors" />
          </Card>
          <Card title="Motion preference" icon={Accessibility} hint="Visits that turned motion off with the site's switch.">
            <p className="big-number">{pct(s.motionOffShare)}</p>
          </Card>
        </Group>

        <Group title="Traffic">
          <Card title="Where visitors came from" icon={Link2}>
            <Bars list={s.sources} tone="visitors" empty="No referrers yet (direct visits only)." />
            {s.campaigns.length ? (
              <>
                <p className="sub-title">Campaigns (utm / ref)</p>
                <Bars list={s.campaigns} tone="visitors" />
              </>
            ) : null}
          </Card>
          <Card title="Social & e-mail clicks" icon={MousePointerClick}>
            <Bars list={s.social} />
          </Card>
          <Card title="Busiest hours (PH time)" icon={Clock} hint="Page views by hour of the day, Philippine time.">
            <Hours hours={s.hours} />
          </Card>
        </Group>

        <Group title="Engagement">
          <Card title="Pages" icon={FileText} hint="Views · average time on the page.">
            <Bars list={s.pages} extra={(i) => `avg ${dur((i as Item & { avgMs: number }).avgMs)}`} />
          </Card>
          <Card title="Home sections" icon={Layers} hint="Share of Home visits that reached each section · average time spent there.">
            <Bars list={s.sections.map((x) => ({ ...x, value: Math.round(x.reach * 100) }))} unit="%" extra={(i) => `avg ${dur(s.sections.find((x) => x.key === i.key)?.avgMs ?? 0)}`} empty="No Home visits yet." />
          </Card>
          <Card title="Top projects" icon={FolderKanban} wide>
            {s.projects.length ? (
              <div className="table-wrap">
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
                    {s.projects.map((p, i) => (
                      <tr key={p.id}>
                        <td>
                          <span className="stable__rank">{i + 1}</span>
                          {p.title}
                        </td>
                        <td>{nf.format(p.views)}</td>
                        <td>{nf.format(p.plays)}</td>
                        <td>{nf.format(p.clicks)}</td>
                        <td>{pct(p.ctr)}</td>
                        <td>{nf.format(p.images)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <StateBox small>No project views yet.</StateBox>
            )}
          </Card>
          <Card title="Link clicks by type" icon={ExternalLink}>
            <Bars list={s.linkKinds} />
          </Card>
          <Card title="Video plays" icon={CirclePlay}>
            <Bars list={s.video.plays} />
            {s.video.plays.length ? <p className="chart-note">Watched to the end: {pct(s.video.completion)}</p> : null}
          </Card>
          <Card title="Certificates viewed" icon={Award}>
            <Bars list={s.certificates} empty={range === 365 ? "Shown for ranges up to 90 days." : "No certificate views yet."} />
          </Card>
        </Group>

        <Group title="Contact & errors">
          <Card title="Contact funnel" icon={Mail}>
            <ul className="funnel">
              <li>
                <span>Contact page visits</span>
                <strong>{nf.format(f.visits)}</strong>
              </li>
              <li>
                <span>Started the form</span>
                <strong>{nf.format(f.starts)}</strong>
              </li>
              <li>
                <span>Messages sent</span>
                <strong>{nf.format(f.sent)}</strong>
              </li>
              <li className="funnel__total">
                <span>Conversion</span>
                <strong>{f.visits ? pct(f.sent / f.visits) : "—"}</strong>
              </li>
            </ul>
          </Card>
          <Card title="Not found (404)" icon={CircleAlert}>
            <Bars list={s.notFound} empty="No broken links ✿" />
          </Card>
        </Group>
      </RangeScope>

      <p className="paper privacy-note">
        <ShieldCheck aria-hidden />
        <span>No cookies are used and no IP addresses are stored. Signed-in admin browsers, bots and preview sites are not counted. Detailed records are kept for 90 days; daily totals are kept.</span>
      </p>
    </>
  );
}
