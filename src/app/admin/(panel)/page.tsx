import Paper from "@mui/material/Paper";
import { count, desc, eq } from "drizzle-orm";
import { ArrowRight, Award, FolderKanban, Mail, PencilLine, Shapes, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActivityList } from "@/components/admin/ActivityList";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { StateBox } from "@/components/admin/StateBox";
import { VisitsChart } from "@/components/admin/VisitsChart";
import { bubbleColor, dateTime, relativeTime } from "@/lib/admin-format";
import { getStats } from "@/server/admin/stats";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Dashboard" };

const TZ = process.env.SITE_TIMEZONE ?? "Asia/Manila";
const isGrades = (title: string) => /^Grades\b/.test(title);
const p = schema.projects;
const m = schema.contactMessages;

function Block({ sticker, tone, title, link, children }: { sticker: string; tone: "pink" | "blue" | "lilac"; title?: string; link?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="dblock" aria-label={title ?? sticker}>
      <div className="dblock__head">
        <span className={`asticker asticker--${tone}`}>{sticker}</span>
        {link ? (
          <Link href={link.href} className="dblock__link">
            {link.label} <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Tile({ href, icon: Icon, label, value, children }: { href: string; icon: LucideIcon; label: string; value: number; children?: ReactNode }) {
  return (
    <Link href={href} className="dtile">
      <span className="dtile__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="dtile__label">{label}</span>
      <span className="dtile__value">{value}</span>
      {children}
    </Link>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { welcome } = await searchParams;
  const [projects, certs, [{ value: tech }], [{ value: unread }], newest, activity, stats] = await Promise.all([
    db.select({ id: p.id, title: p.title, slug: p.slug, status: p.status, publishedAt: p.publishedAt, updatedAt: p.updatedAt }).from(p).orderBy(desc(p.publishedAt), desc(p.updatedAt)),
    db.select({ title: schema.certifications.title }).from(schema.certifications).where(eq(schema.certifications.status, "published")),
    db.select({ value: count() }).from(schema.technologies),
    db.select({ value: count() }).from(m).where(eq(m.status, "unread")),
    db.select({ id: m.id, name: m.name, email: m.email, subject: m.subject, createdAt: m.createdAt }).from(m).where(eq(m.status, "unread")).orderBy(desc(m.createdAt)).limit(3),
    db
      .select({ at: schema.activityLog.occurredAt, action: schema.activityLog.action, summary: schema.activityLog.summary })
      .from(schema.activityLog)
      .orderBy(desc(schema.activityLog.occurredAt))
      .limit(5),
    getStats(7),
  ]);

  const published = projects.filter((x) => x.status === "published");
  const drafts = projects.filter((x) => x.status === "draft");
  const latest = published[0];
  const grades = certs.filter((c) => isGrades(c.title)).length;
  const today = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());
  const kpis = [
    { label: "Today", value: stats.kpi.today },
    { label: "This week", value: stats.kpi.week },
    { label: "This month", value: stats.kpi.month },
  ];

  return (
    <>
      <AdminPageHead href="/admin" title="Hello, Kyle!" />

      <Paper elevation={0} className="dwelcome">
        <span className="atape atape--blue dwelcome__tape" aria-hidden="true" />
        <div>
          <p className="dwelcome__lead">Here&apos;s what&apos;s on the site and what&apos;s waiting for you.</p>
          {welcome ? <p className="dwelcome__ok">Password changed. Welcome to your admin panel ✿</p> : null}
        </div>
        <p className="dwelcome__date">
          {today} <span>· PH time</span>
        </p>
      </Paper>

      <div className="dgrid">
        <Block sticker="Site content" tone="pink">
          <div className="dtiles">
            <Tile href="/admin/projects" icon={FolderKanban} label="Published projects" value={published.length}>
              <span className="dtile__sub">
                {drafts.length ? <span className="apill apill--draft">{drafts.length} draft{drafts.length === 1 ? "" : "s"}</span> : "no drafts"}
              </span>
              {projects.length ? (
                <span className="dsplit" aria-hidden="true">
                  <span style={{ flexGrow: published.length }} />
                  <span className="dsplit__draft" style={{ flexGrow: drafts.length }} />
                </span>
              ) : null}
            </Tile>
            <Tile href="/admin/certifications" icon={Award} label="Certifications" value={certs.length}>
              <span className="dtile__sub">
                {certs.length - grades} certificates · {grades} grade report{grades === 1 ? "" : "s"}
              </span>
            </Tile>
            <Tile href="/admin/tech" icon={Shapes} label="Tech catalog" value={tech}>
              <span className="dtile__sub">technologies</span>
            </Tile>
          </div>
          {latest ? (
            <p className="dlatest">
              <span className="admin-label">Latest</span>
              <Link href={`/admin/projects/${latest.id}`}>{latest.title}</Link>
              <span className="dlatest__when">published {dateTime(latest.publishedAt)}</span>
            </p>
          ) : null}
        </Block>

        <Block sticker="Waiting for you" tone="lilac" link={unread ? { href: "/admin/messages", label: "Inbox" } : undefined}>
          <Paper elevation={0} className="dpanel">
            <p className="dpanel__title">
              <Mail size={16} aria-hidden /> {unread ? `${unread} unread message${unread === 1 ? "" : "s"}` : "No unread messages"}
            </p>
            {newest.length ? (
              <ul className="dmsgs">
                {newest.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/messages/${x.id}`} className="dmsgs__row">
                      <span className="msglist__bubble" style={{ background: bubbleColor(x.email) }} aria-hidden="true">
                        {x.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="dmsgs__text">
                        <strong>{x.name}</strong>
                        <span>{x.subject}</span>
                      </span>
                      <span className="dmsgs__when">{relativeTime(x.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="dpanel__title">
              <PencilLine size={16} aria-hidden /> {drafts.length ? `${drafts.length} draft project${drafts.length === 1 ? "" : "s"}` : "No draft projects"}
            </p>
            {drafts.length ? (
              <ul className="ddrafts">
                {drafts.map((d) => (
                  <li key={d.id}>
                    <span>
                      <strong>{d.title}</strong>
                      <span className="dlatest__when">last saved {relativeTime(d.updatedAt)}</span>
                    </span>
                    <Link href={`/admin/projects/${d.id}`} className="dblock__link">
                      Continue editing <ArrowRight size={14} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {!unread && !drafts.length ? <StateBox small>Nothing waiting ✿</StateBox> : null}
          </Paper>
        </Block>

        <Block sticker="Visitors · last 7 days" tone="blue" link={{ href: "/admin/statistics", label: "Statistics" }}>
          <Paper elevation={0} className="dpanel">
            <div className="dkpis">
              {kpis.map((k) => (
                <div key={k.label} className="dkpi">
                  <span className="admin-label">{k.label}</span>
                  <span className="dkpi__value">{k.value[0]}</span>
                  <span className="dkpi__sub">{k.value[1]} unique</span>
                </div>
              ))}
            </div>
            <VisitsChart series={stats.series} range={7} compact />
          </Paper>
        </Block>

        <Block sticker="Recent activity" tone="pink" link={{ href: "/admin/activity", label: "All activity" }}>
          <Paper elevation={0} className="dpanel">{activity.length ? <ActivityList rows={activity} compact /> : <StateBox small>Nothing yet.</StateBox>}</Paper>
        </Block>
      </div>
    </>
  );
}
