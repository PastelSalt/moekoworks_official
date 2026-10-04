import "server-only";

import { count, eq, gte, and, inArray, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/server/db";

// Statistics queries (plan §12, §17.4). Ranges ≤ 90 days read raw events (kept 90 days);
// the 1-year range reads analytics_daily. Days are Asia/Manila calendar days; weeks start Monday.
export type Range = 7 | 30 | 90 | 365;
export const RANGES: Range[] = [7, 30, 90, 365];
const TZ = "Asia/Manila";

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);
async function q<T extends Row>(query: SQL): Promise<T[]> {
  const r = await db.execute(query);
  return r.rows as T[];
}

const localDay = sql`(occurred_at at time zone ${TZ})::date`;
const todayLocal = sql`(now() at time zone ${TZ})::date`;

export type Item = { key: string; label: string; value: number; extra?: string };
export type Stats = {
  range: Range;
  allEnv: boolean;
  kpi: { today: [number, number]; week: [number, number]; month: [number, number]; avgVisitMs: number; avgLoadMs: number; visitsInRange: number; unread: number; messagesInRange: number };
  series: { day: string; visits: number; uniques: number }[];
  pages: (Item & { avgMs: number })[];
  sections: (Item & { reach: number; avgMs: number })[];
  projects: { id: number; title: string; views: number; plays: number; clicks: number; ctr: number; images: number }[];
  linkKinds: Item[];
  video: { plays: Item[]; completion: number };
  certificates: Item[];
  funnel: { visits: number; starts: number; sent: number };
  social: Item[];
  sources: Item[];
  campaigns: Item[];
  countries: Item[];
  phShare: number;
  devices: Item[];
  browsers: Item[];
  os: Item[];
  languages: Item[];
  hours: number[];
  motionOffShare: number;
  notFound: Item[];
};

const items = (rows: Row[], label = (k: string) => k): Item[] => rows.map((r) => ({ key: String(r.k ?? ""), label: label(String(r.k ?? "")), value: num(r.v) }));

export async function getStats(range: Range, allEnv = false): Promise<Stats> {
  const env = allEnv ? sql`true` : sql`environment = 'production'`;
  const inRange = sql`${env} and ${localDay} > ${todayLocal} - ${range === 365 ? 90 : range}::int`;
  const raw = range !== 365;

  // ── KPIs (always raw: today / this week / this month) ──
  const kpiQ = q<Row>(sql`
    with pv as (
      select visit_id, visitor_hash, ${localDay} as d from analytics_events
      where event_type = 'page_view' and ${env} and occurred_at > now() - interval '32 days'
    ), daily as (select d, count(distinct visitor_hash) as u from pv group by d)
    select
      (select count(distinct visit_id) from pv where d = ${todayLocal}) as tv,
      (select coalesce(sum(u), 0) from daily where d = ${todayLocal}) as tu,
      (select count(distinct visit_id) from pv where d >= date_trunc('week', ${todayLocal})::date) as wv,
      (select coalesce(sum(u), 0) from daily where d >= date_trunc('week', ${todayLocal})::date) as wu,
      (select count(distinct visit_id) from pv where d >= date_trunc('month', ${todayLocal})::date) as mv,
      (select coalesce(sum(u), 0) from daily where d >= date_trunc('month', ${todayLocal})::date) as mu
  `);

  const m = schema.contactMessages;
  const sinceDate = new Date(Date.now() - range * 86_400_000);
  const msgQ = Promise.all([
    db.select({ v: count() }).from(m).where(eq(m.status, "unread")),
    db.select({ v: count() }).from(m).where(and(gte(m.createdAt, sinceDate), inArray(m.status, ["unread", "read", "archived"]))),
  ]);

  if (!raw) return yearStats(range, allEnv, await kpiQ, await msgQ);

  const [kpi, [[unread], [inRangeMsgs]], series, avgs, pages, sections, homeVisits, projects, linkKinds, plays, completes, certs, funnel, social, sources, campaigns, countries, devices, browsers, os, languages, hours, motion, notFound] =
    await Promise.all([
      kpiQ,
      msgQ,
      q<Row>(sql`select ${localDay}::text as day, count(distinct visit_id) as visits, count(distinct visitor_hash) as uniques from analytics_events where event_type = 'page_view' and ${inRange} group by 1 order by 1`),
      q<Row>(sql`
        select
          (select avg(ms) from (select least(sum(duration_ms), 1800000) as ms from analytics_events where event_type = 'page_dwell' and ${inRange} group by visit_id) v) as visit_ms,
          (select avg(duration_ms) from analytics_events where event_type = 'loader_timing' and ${inRange}) as load_ms,
          (select count(distinct visit_id) from analytics_events where event_type = 'page_view' and ${inRange}) as visits`),
      q<Row>(sql`select coalesce(path, '') as k, count(*) filter (where event_type = 'page_view') as v, coalesce(sum(duration_ms) filter (where event_type = 'page_dwell'), 0) as ms
        from analytics_events where event_type in ('page_view', 'page_dwell') and ${inRange} group by 1 order by 2 desc limit 15`),
      q<Row>(sql`select section as k, count(distinct visit_id) as v, coalesce(sum(duration_ms), 0) as ms from analytics_events where event_type = 'section_dwell' and ${inRange} group by 1`),
      q<Row>(sql`select count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and path = '/' and ${inRange}`),
      q<Row>(sql`select e.content_id as id, p.title,
          count(*) filter (where e.event_type = 'project_view') as views,
          count(*) filter (where e.event_type = 'video_play') as plays,
          count(*) filter (where e.event_type = 'project_link_click') as clicks,
          count(*) filter (where e.event_type = 'image_open') as images
        from analytics_events e join projects p on p.id = e.content_id
        where e.content_type = 'project' and ${inRange} group by 1, 2 order by views desc, clicks desc limit 12`),
      q<Row>(sql`select coalesce(target, '') as k, count(*) as v from analytics_events where event_type = 'project_link_click' and ${inRange} group by 1 order by 2 desc`),
      q<Row>(sql`select coalesce(target, '') as k, count(*) as v from analytics_events where event_type = 'video_play' and ${inRange} group by 1 order by 2 desc`),
      q<Row>(sql`select count(*) as v from analytics_events where event_type = 'video_complete' and ${inRange}`),
      q<Row>(sql`select c.title as k, count(*) as v from analytics_events e join certifications c on c.id = e.content_id where e.event_type = 'certificate_open' and ${inRange} group by 1 order by 2 desc limit 10`),
      q<Row>(sql`select
          count(distinct visit_id) filter (where event_type = 'page_view' and path = '/contact') as visits,
          count(distinct visit_id) filter (where event_type = 'contact_start') as starts,
          count(distinct visit_id) filter (where event_type = 'contact_submit') as sent
        from analytics_events where ${inRange}`),
      q<Row>(sql`select coalesce(target, '') as k, count(*) as v from analytics_events where event_type = 'outbound_click' and ${inRange} group by 1 order by 2 desc`),
      q<Row>(sql`select referrer_host as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and referrer_host is not null and ${inRange} group by 1 order by 2 desc limit 12`),
      q<Row>(sql`select concat_ws(' / ', utm_source, utm_medium, utm_campaign) as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and utm_source is not null and ${inRange} group by 1 order by 2 desc limit 10`),
      q<Row>(sql`select coalesce(country, '??') as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and ${inRange} group by 1 order by 2 desc limit 15`),
      q<Row>(sql`select device_type as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and ${inRange} group by 1 order by 2 desc`),
      q<Row>(sql`select coalesce(browser, 'Other') as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and ${inRange} group by 1 order by 2 desc`),
      q<Row>(sql`select coalesce(os, 'Other') as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and ${inRange} group by 1 order by 2 desc`),
      q<Row>(sql`select coalesce(language, '??') as k, count(distinct visit_id) as v from analytics_events where event_type = 'page_view' and ${inRange} group by 1 order by 2 desc limit 10`),
      q<Row>(sql`select extract(hour from occurred_at at time zone ${TZ})::int as k, count(*) as v from analytics_events where event_type = 'page_view' and ${inRange} group by 1`),
      q<Row>(sql`select count(distinct visit_id) as v from analytics_events where event_type = 'motion_toggle' and target = 'off' and ${inRange}`),
      q<Row>(sql`select coalesce(path, '') as k, count(*) as v from analytics_events where event_type = 'not_found' and ${inRange} group by 1 order by 2 desc limit 10`),
    ]);

  const visits = num(avgs[0]?.visits);
  const home = num(homeVisits[0]?.v);
  const countryItems = items(countries, countryName);
  const playItems = items(plays, playLabel);
  const totalPlays = playItems.reduce((a, b) => a + b.value, 0);
  return {
    range,
    allEnv,
    kpi: kpiFrom(kpi[0], { avgVisitMs: num(avgs[0]?.visit_ms), avgLoadMs: num(avgs[0]?.load_ms), visitsInRange: visits, unread: unread.v, messagesInRange: inRangeMsgs.v }),
    series: series.map((r) => ({ day: String(r.day), visits: num(r.visits), uniques: num(r.uniques) })),
    pages: pages.map((r) => ({ key: String(r.k), label: String(r.k) || "/", value: num(r.v), avgMs: num(r.v) ? num(r.ms) / num(r.v) : 0 })),
    sections: sections
      .map((r) => ({ key: String(r.k), label: SECTION_LABEL[String(r.k)] ?? String(r.k), value: num(r.v), reach: home ? num(r.v) / home : 0, avgMs: num(r.v) ? num(r.ms) / num(r.v) : 0 }))
      .sort((a, b) => SECTION_ORDER.indexOf(a.key) - SECTION_ORDER.indexOf(b.key)),
    projects: projects.map((r) => ({ id: num(r.id), title: String(r.title), views: num(r.views), plays: num(r.plays), clicks: num(r.clicks), images: num(r.images), ctr: num(r.views) ? num(r.clicks) / num(r.views) : 0 })),
    linkKinds: items(linkKinds, linkLabel),
    video: { plays: playItems, completion: totalPlays ? num(completes[0]?.v) / totalPlays : 0 },
    certificates: items(certs),
    funnel: { visits: num(funnel[0]?.visits), starts: num(funnel[0]?.starts), sent: num(funnel[0]?.sent) },
    social: items(social, socialLabel),
    sources: items(sources),
    campaigns: items(campaigns),
    countries: countryItems,
    phShare: share(countryItems, "PH"),
    devices: items(devices, cap),
    browsers: items(browsers),
    os: items(os),
    languages: items(languages),
    hours: Array.from({ length: 24 }, (_, h) => num(hours.find((r) => num(r.k) === h)?.v)),
    motionOffShare: visits ? num(motion[0]?.v) / visits : 0,
    notFound: items(notFound),
  };
}

/** The 1-year view: everything from analytics_daily (production only, rolled up nightly). */
async function yearStats(range: Range, allEnv: boolean, kpi: Row[], msgs: [{ v: number }[], { v: number }[]]): Promise<Stats> {
  const rows = await q<Row>(sql`select day::text as day, metric, dimension, sum(value) as v from analytics_daily where day > ${todayLocal} - 365 group by 1, 2, 3`);
  const by = (metric: string) => {
    const map = new Map<string, number>();
    for (const r of rows) if (r.metric === metric) map.set(String(r.dimension), (map.get(String(r.dimension)) ?? 0) + num(r.v));
    return [...map.entries()].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  };
  const total = (metric: string) => by(metric).reduce((a, b) => a + b.v, 0);
  const days = new Map<string, { visits: number; uniques: number }>();
  for (const r of rows) {
    if (r.metric !== "visits" && r.metric !== "uniques") continue;
    const d = days.get(String(r.day)) ?? { visits: 0, uniques: 0 };
    d[r.metric] = num(r.v);
    days.set(String(r.day), d);
  }
  const visits = total("visits");
  const home = total("home_visits");
  const titles = new Map((await db.select({ id: schema.projects.id, title: schema.projects.title }).from(schema.projects)).map((p) => [p.id, p.title]));
  const per = (metric: string) => {
    const map = new Map<number, number>();
    for (const r of by(metric)) map.set(Number(r.k.split(":")[0]), (map.get(Number(r.k.split(":")[0])) ?? 0) + r.v);
    return map;
  };
  const views = per("project_views");
  const clicks = per("link_clicks");
  const playsBy = per("video_plays");
  const images = per("image_opens");
  const ids = [...new Set([...views.keys(), ...clicks.keys(), ...playsBy.keys()])].filter((id) => titles.has(id));
  const kindMap = new Map<string, number>();
  for (const r of by("link_clicks")) kindMap.set(r.k.split(":")[1] ?? "", (kindMap.get(r.k.split(":")[1] ?? "") ?? 0) + r.v);
  const playMap = new Map<string, number>();
  for (const r of by("video_plays")) playMap.set(r.k.split(":")[1] ?? "", (playMap.get(r.k.split(":")[1] ?? "") ?? 0) + r.v);
  const playItems = [...playMap.entries()].map(([k, v]) => ({ key: k, label: playLabel(k), value: v }));
  const totalPlays = playItems.reduce((a, b) => a + b.value, 0);
  const countryItems = items(by("countries"), countryName);
  const sectionMs = new Map(by("section_ms").map((r) => [r.k, r.v]));
  return {
    range,
    allEnv,
    kpi: kpiFrom(kpi[0], { avgVisitMs: total("visit_ms_n") ? total("visit_ms") / total("visit_ms_n") : 0, avgLoadMs: total("loader_n") ? total("loader_ms") / total("loader_n") : 0, visitsInRange: visits, unread: msgs[0][0].v, messagesInRange: msgs[1][0].v }),
    series: [...days.entries()].sort().map(([day, v]) => ({ day, ...v })),
    pages: by("pageviews").slice(0, 15).map((r) => ({ key: r.k, label: r.k || "/", value: r.v, avgMs: r.v ? (new Map(by("page_ms").map((x) => [x.k, x.v])).get(r.k) ?? 0) / r.v : 0 })),
    sections: by("section_reach")
      .map((r) => ({ key: r.k, label: SECTION_LABEL[r.k] ?? r.k, value: r.v, reach: home ? r.v / home : 0, avgMs: r.v ? (sectionMs.get(r.k) ?? 0) / r.v : 0 }))
      .sort((a, b) => SECTION_ORDER.indexOf(a.key) - SECTION_ORDER.indexOf(b.key)),
    projects: ids.map((id) => ({ id, title: titles.get(id)!, views: views.get(id) ?? 0, plays: playsBy.get(id) ?? 0, clicks: clicks.get(id) ?? 0, images: images.get(id) ?? 0, ctr: views.get(id) ? (clicks.get(id) ?? 0) / views.get(id)! : 0 })),
    linkKinds: [...kindMap.entries()].map(([k, v]) => ({ key: k, label: linkLabel(k), value: v })).sort((a, b) => b.value - a.value),
    video: { plays: playItems, completion: totalPlays ? total("video_completes") / totalPlays : 0 },
    certificates: [],
    funnel: { visits: total("contact_visits"), starts: total("contact_starts"), sent: total("contact_submits") },
    social: items(by("outbound"), socialLabel),
    sources: items(by("sources").slice(0, 12)),
    campaigns: items(by("campaigns").slice(0, 10)),
    countries: countryItems.slice(0, 15),
    phShare: share(countryItems, "PH"),
    devices: items(by("devices"), cap),
    browsers: items(by("browsers")),
    os: items(by("os")),
    languages: items(by("languages").slice(0, 10)),
    hours: Array.from({ length: 24 }, (_, h) => by("hours").find((r) => Number(r.k) === h)?.v ?? 0),
    motionOffShare: visits ? total("motion_off") / visits : 0,
    notFound: items(by("not_found").slice(0, 10)),
  };
}

function kpiFrom(r: Row | undefined, rest: Omit<Stats["kpi"], "today" | "week" | "month">): Stats["kpi"] {
  return { today: [num(r?.tv), num(r?.tu)], week: [num(r?.wv), num(r?.wu)], month: [num(r?.mv), num(r?.mu)], ...rest };
}

const share = (list: Item[], key: string) => {
  const total = list.reduce((a, b) => a + b.value, 0);
  return total ? (list.find((i) => i.key === key)?.value ?? 0) / total : 0;
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SECTION_ORDER = ["hero", "latest", "profile", "works", "toolbox", "certifications", "news", "contact"];
const SECTION_LABEL: Record<string, string> = { hero: "Key visual", latest: "Latest project", profile: "Profile strip", works: "Works", toolbox: "Toolbox", certifications: "Certifications", news: "News", contact: "Contact banner" };
const linkLabel = (k: string) => ({ live: "Visit website", apk: "APK", exe: "Windows (EXE)", msi: "Windows (MSI)", dmg: "macOS", appimage: "Linux", play_store: "Google Play", app_store: "App Store", ios: "iOS", docs: "Docs", paper: "Paper", demo_video: "Demo video", other: "Other" })[k] ?? k;
const playLabel = (k: string) => ({ hover: "Hover previews (≥ 1 s)", auto: "Autoplay watched (≥ 3 s)", click: "Clicked play" })[k] ?? k;
const socialLabel = (k: string) => ({ github: "GitHub", facebook: "Facebook", email: "E-mail" })[k] ?? k;
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(cc: string) {
  if (!/^[A-Z]{2}$/.test(cc)) return "Unknown";
  try {
    return regionNames.of(cc) ?? cc;
  } catch {
    return cc;
  }
}
