import { count, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/views/DashboardView";
import { getStats } from "@/server/admin/stats";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";
import { getToolbox } from "@/server/queries/public";

export const metadata: Metadata = { title: "Dashboard" };

const TZ = process.env.SITE_TIMEZONE ?? "Asia/Manila";
const isGrades = (title: string) => /^Grades\b/.test(title);
const p = schema.projects;
const m = schema.contactMessages;
const a = schema.activityLog;

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { welcome } = await searchParams;
  const [projects, certs, toolbox, msgCounts, unreadList, activity, stats] = await Promise.all([
    db.select({ id: p.id, title: p.title, status: p.status, publishedAt: p.publishedAt, updatedAt: p.updatedAt }).from(p).orderBy(desc(p.publishedAt), desc(p.updatedAt)),
    db.select({ title: schema.certifications.title, status: schema.certifications.status }).from(schema.certifications),
    getToolbox(),
    db.select({ status: m.status, value: count() }).from(m).where(inArray(m.status, ["unread", "read"])).groupBy(m.status),
    db.select({ id: m.id, name: m.name, email: m.email, subject: m.subject, createdAt: m.createdAt }).from(m).where(eq(m.status, "unread")).orderBy(desc(m.createdAt)).limit(3),
    db
      .select({ at: a.occurredAt, action: a.action, summary: a.summary, user: schema.adminUsers.username })
      .from(a)
      .leftJoin(schema.adminUsers, eq(schema.adminUsers.id, a.adminUserId))
      .orderBy(desc(a.occurredAt))
      .limit(5),
    getStats(30),
  ]);

  const published = projects.filter((x) => x.status === "published");
  const drafts = projects.filter((x) => x.status === "draft");
  const shown = certs.filter((c) => c.status === "published");
  const unread = msgCounts.find((x) => x.status === "unread")?.value ?? 0;

  return (
    <DashboardView
      d={{
        today: new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "full" }).format(new Date()),
        welcome: Boolean(welcome),
        projects: { published: published.length, drafts: drafts.length },
        certs: { shown: shown.length, hidden: certs.filter((c) => c.status === "draft").length, grades: shown.filter((c) => isGrades(c.title)).length },
        tech: { total: toolbox.length, used: toolbox.filter((t) => t.projects > 0).length },
        messages: { unread, inbox: msgCounts.reduce((s, x) => s + x.value, 0) },
        latest: published[0] ? { id: published[0].id, title: published[0].title, publishedAt: published[0].publishedAt } : null,
        unreadList,
        draftList: drafts.map((x) => ({ id: x.id, title: x.title, updatedAt: x.updatedAt })),
        activity,
        visitors: { today: stats.kpi.today, week: stats.kpi.week, month: stats.kpi.month, series: stats.series },
      }}
    />
  );
}
