import { eq, sql } from "drizzle-orm";
import { createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import { EVENT_TYPES } from "@/lib/track";
import { isBot, parseUA } from "@/lib/ua";
import { db, schema } from "@/server/db";

// Visit statistics ingestion (plan §17.2). Cookieless: visitors are counted with a hash of
// (daily salt, IP, user agent, host) that changes every day; IP addresses are never stored.
export const dynamic = "force-dynamic";

const Event = z.object({
  t: z.enum(EVENT_TYPES),
  p: z.string().max(200).optional(),
  s: z.string().max(40).optional(),
  ms: z.number().int().min(0).max(1_800_000).optional(),
  id: z.number().int().positive().optional(),
  tg: z.string().max(60).optional(),
});
const Payload = z.object({
  v: z.string().min(8).max(64),
  d: z.enum(["mobile", "tablet", "desktop", "unknown"]),
  l: z.string().max(10).optional(),
  r: z.string().max(253).optional(),
  u: z.object({ s: z.string().max(60), m: z.string().max(60).optional(), c: z.string().max(80).optional() }).optional(),
  nt: z.union([z.literal(0), z.literal(1)]).optional(),
  e: z.array(Event).min(1).max(50),
});

const TZ = process.env.SITE_TIMEZONE ?? "Asia/Manila";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// One salt per day (rotated by the daily cron); cached per server instance.
const salts = new Map<string, Buffer>();
async function saltFor(day: string) {
  const cached = salts.get(day);
  if (cached) return cached;
  await db.insert(schema.analyticsSalts).values({ day, salt: randomBytes(32) }).onConflictDoNothing();
  const [row] = await db.select().from(schema.analyticsSalts).where(eq(schema.analyticsSalts.day, day)).limit(1);
  const salt = row.salt;
  salts.clear();
  salts.set(day, salt);
  return salt;
}

// Soft per-instance rate limit (no DB write per request): 60 batches / minute / visitor.
const hits = new Map<string, { n: number; t: number }>();
function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > 60_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 60;
}

const CONTENT_TYPE: Partial<Record<(typeof EVENT_TYPES)[number], string>> = {
  project_view: "project",
  project_open: "project",
  project_link_click: "project",
  video_play: "project",
  video_complete: "project",
  image_open: "project",
  certificate_open: "certification",
};

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 16_384) return new Response(null, { status: 413 });
  let parsed: z.infer<typeof Payload>;
  try {
    const result = Payload.safeParse(JSON.parse(text));
    if (!result.success) return new Response(null, { status: 400 });
    parsed = result.data;
  } catch {
    return new Response(null, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const cookie = req.headers.get("cookie") ?? "";
  // Not counted: bots, signed-in admin browsers, visitors who opted out.
  if (isBot(ua) || /(?:^|;\s*)(?:__Host-)?mw_session=/.test(cookie) || parsed.nt === 1) return new Response(null, { status: 204 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
  const host = req.headers.get("host") ?? "";
  const salt = await saltFor(today());
  const visitorHash = createHmac("sha256", salt).update(`${ip}|${ua}|${host}`).digest("base64url").slice(0, 22);
  if (limited(visitorHash)) return new Response(null, { status: 204 });

  const { browser, os } = parseUA(ua);
  const env = process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "development";
  const country = req.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null;

  await db.insert(schema.analyticsEvents).values(
    parsed.e.map((e) => ({
      eventType: e.t,
      visitId: parsed.v,
      visitorHash,
      path: e.p ?? null,
      section: e.s ?? null,
      durationMs: e.ms ?? null,
      contentType: e.id ? (CONTENT_TYPE[e.t] ?? null) : null,
      contentId: e.id ?? null,
      target: e.tg ?? null,
      deviceType: parsed.d,
      browser,
      os,
      language: parsed.l ?? null,
      country,
      referrerHost: parsed.r ?? null,
      utmSource: parsed.u?.s ?? null,
      utmMedium: parsed.u?.m ?? null,
      utmCampaign: parsed.u?.c ?? null,
      environment: env,
      occurredAt: sql`now()`,
    })),
  );
  return new Response(null, { status: 204 });
}
