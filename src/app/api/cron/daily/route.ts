import { sql } from "drizzle-orm";
import { db } from "@/server/db";

// Daily housekeeping (plan §17.3), scheduled 16:30 UTC = 00:30 Asia/Manila in vercel.json.
// Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else gets 401.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TZ = "Asia/Manila";

/** Rolls one Manila calendar day of production events into analytics_daily (idempotent). */
async function rollup(day: string) {
  await db.execute(sql`delete from analytics_daily where day = ${day}::date`);
  await db.execute(sql`
    with ev as (
      select * from analytics_events
      where environment = 'production' and (occurred_at at time zone ${TZ})::date = ${day}::date
    ), pv as (select * from ev where event_type = 'page_view'),
    visit_ms as (
      select visit_id, least(sum(duration_ms), 1800000) as ms from ev where event_type = 'page_dwell' group by visit_id
    )
    insert into analytics_daily (day, metric, dimension, value)
    select ${day}::date, metric, dimension, value from (
      select 'visits' as metric, '' as dimension, count(distinct visit_id) as value from pv
      union all select 'uniques', '', count(distinct visitor_hash) from pv
      union all select 'visit_ms', '', coalesce(sum(ms), 0) from visit_ms
      union all select 'visit_ms_n', '', count(*) from visit_ms
      union all select 'loader_ms', '', coalesce(sum(duration_ms), 0) from ev where event_type = 'loader_timing'
      union all select 'loader_n', '', count(*) from ev where event_type = 'loader_timing'
      union all select 'pageviews', coalesce(path, ''), count(*) from pv group by path
      union all select 'page_ms', coalesce(path, ''), coalesce(sum(duration_ms), 0) from ev where event_type = 'page_dwell' group by path
      union all select 'section_reach', section, count(distinct visit_id) from ev where event_type = 'section_dwell' group by section
      union all select 'section_ms', section, coalesce(sum(duration_ms), 0) from ev where event_type = 'section_dwell' group by section
      union all select 'home_visits', '', count(distinct visit_id) from pv where path = '/'
      union all select 'project_views', content_id::text, count(*) from ev where event_type = 'project_view' and content_id is not null group by content_id
      union all select 'link_clicks', content_id::text || ':' || coalesce(target, ''), count(*) from ev where event_type = 'project_link_click' group by content_id, target
      union all select 'video_plays', content_id::text || ':' || coalesce(target, ''), count(*) from ev where event_type = 'video_play' group by content_id, target
      union all select 'video_completes', content_id::text, count(*) from ev where event_type = 'video_complete' group by content_id
      union all select 'image_opens', content_id::text, count(*) from ev where event_type = 'image_open' group by content_id
      union all select 'certificate_opens', content_id::text, count(*) from ev where event_type = 'certificate_open' group by content_id
      union all select 'outbound', coalesce(target, ''), count(*) from ev where event_type = 'outbound_click' group by target
      union all select 'sources', referrer_host, count(distinct visit_id) from pv where referrer_host is not null group by referrer_host
      union all select 'campaigns', concat_ws(' / ', utm_source, utm_medium, utm_campaign), count(distinct visit_id) from pv where utm_source is not null group by 2
      union all select 'countries', coalesce(country, '??'), count(distinct visit_id) from pv group by country
      union all select 'devices', device_type, count(distinct visit_id) from pv group by device_type
      union all select 'browsers', coalesce(browser, 'Other'), count(distinct visit_id) from pv group by browser
      union all select 'os', coalesce(os, 'Other'), count(distinct visit_id) from pv group by os
      union all select 'languages', coalesce(language, '??'), count(distinct visit_id) from pv group by language
      union all select 'hours', extract(hour from occurred_at at time zone ${TZ})::int::text, count(*) from pv group by 2
      union all select 'motion_off', '', count(distinct visit_id) from ev where event_type = 'motion_toggle' and target = 'off'
      union all select 'not_found', coalesce(path, ''), count(*) from ev where event_type = 'not_found' group by path
      union all select 'contact_visits', '', count(distinct visit_id) from pv where path = '/contact'
      union all select 'contact_starts', '', count(distinct visit_id) from ev where event_type = 'contact_start'
      union all select 'contact_submits', '', count(distinct visit_id) from ev where event_type = 'contact_submit'
    ) m where value > 0 or metric in ('visits', 'uniques')
  `);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  // yesterday + the two days before (late events), in Manila time
  const days: string[] = [];
  for (let i = 1; i <= 3; i++) {
    days.push(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() - i * 86_400_000)));
  }
  for (const day of days) await rollup(day);

  // retention (plan §17.3, §13.5)
  const purged = await Promise.all([
    db.execute(sql`delete from analytics_events where occurred_at < now() - interval '90 days'`),
    db.execute(sql`delete from analytics_salts where day < (now() at time zone ${TZ})::date - 2`),
    db.execute(sql`delete from admin_sessions where expires_at < now() - interval '7 days' or revoked_at < now() - interval '7 days'`),
    db.execute(sql`delete from login_attempts where attempted_at < now() - interval '30 days'`),
    db.execute(sql`delete from rate_limits where window_start < now() - interval '2 days'`),
    db.execute(sql`delete from contact_messages where (status = 'trash' and trashed_at < now() - interval '30 days') or (status = 'spam' and created_at < now() - interval '30 days')`),
  ]);
  return Response.json({ ok: true, rolledUp: days, purged: purged.map((r) => (r as { rowCount?: number }).rowCount ?? null) });
}
