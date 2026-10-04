import { sql } from "drizzle-orm";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";

// CSV export of raw events for the selected range (≤ 90 days). Visitor hashes are not exported.
export const dynamic = "force-dynamic";

const COLS = ["occurred_at", "event_type", "path", "section", "duration_ms", "content_type", "content_id", "target", "device_type", "browser", "os", "language", "country", "referrer_host", "utm_source", "utm_medium", "utm_campaign", "environment"];
const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // no formula injection in spreadsheets
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.restricted) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const range = Math.min(90, Math.max(1, Number(url.searchParams.get("range")) || 30));
  const env = url.searchParams.get("env") === "all" ? sql`true` : sql`environment = 'production'`;
  const r = await db.execute(sql`
    select to_char(occurred_at at time zone 'Asia/Manila', 'YYYY-MM-DD HH24:MI:SS') as occurred_at, event_type, path, section, duration_ms,
      content_type, content_id, target, device_type, browser, os, language, country, referrer_host, utm_source, utm_medium, utm_campaign, environment
    from analytics_events
    where ${env} and (occurred_at at time zone 'Asia/Manila')::date > (now() at time zone 'Asia/Manila')::date - ${range}::int
    order by occurred_at`);
  const rows = r.rows as Record<string, unknown>[];
  const csv = [COLS.join(","), ...rows.map((row) => COLS.map((c) => cell(row[c])).join(","))].join("\n");
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="moesoft-statistics-${range}d-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}
