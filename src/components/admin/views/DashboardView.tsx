import { ArrowRight, Award, Calendar, CalendarDays, CalendarHeart, CircleCheck, FolderKanban, Mail, PencilLine, Shapes, Sun, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { bubbleColor, relativeTime } from "@/lib/admin-format";
import { type ActivityRow, ActivityList } from "../ActivityList";
import { KpiCard } from "../KpiCard";
import { StateBox } from "../StateBox";
import { Flower, Sticker } from "../Sticker";
import { VisitsChart } from "../VisitsChart";

export type DashboardData = {
  today: string;
  welcome: boolean;
  projects: { published: number; drafts: number };
  certs: { shown: number; hidden: number; grades: number };
  tech: { total: number; used: number };
  messages: { unread: number; inbox: number };
  latest: { id: number; title: string; publishedAt: Date | null } | null;
  unreadList: { id: number; name: string; email: string; subject: string; createdAt: Date }[];
  draftList: { id: number; title: string; updatedAt: Date }[];
  activity: ActivityRow[];
  visitors: { today: [number, number]; week: [number, number]; month: [number, number]; series: { day: string; visits: number; uniques: number }[] };
};

const nf = new Intl.NumberFormat("en-US");

/** Kotoha tile: icon + arrow, label, "N published", draft pill or "all good", split bar. The whole tile is a link. */
function Tile({ href, icon: Icon, label, value, unit, foot, share, tone = "content" }: { href: string; icon: LucideIcon; label: string; value: number; unit: string; foot: ReactNode; share: number; tone?: "content" | "messages" }) {
  return (
    <Link href={href} className={`tile tile--${tone}`}>
      <span className="tile__top">
        <span className="tile__icon" aria-hidden="true">
          <Icon />
        </span>
        <ArrowRight className="tile__go" aria-hidden />
      </span>
      <span className="tile__label">{label}</span>
      <span className="tile__value">
        {nf.format(value)}
        <small>{unit}</small>
      </span>
      <span className="tile__foot">{foot}</span>
      <span className="split" aria-hidden="true">
        <span className="split__pub" style={{ width: `${Math.round(share * 100)}%` }} />
      </span>
    </Link>
  );
}

const plural = (n: number, one: string, many: string) => `${nf.format(n)} ${n === 1 ? one : many}`;

export function DashboardView({ d }: { d: DashboardData }) {
  const p = d.projects;
  const c = d.certs;
  const waiting = d.messages.unread > 0 || d.draftList.length > 0;
  return (
    <>
      <section className="paper stitch welcome">
        <Flower tone="pink" className="welcome__deco" />
        <div className="welcome__text">
          <Sticker as="h1">Hello, Kyle!</Sticker>
          <p>Here you can manage everything that appears on Moeko Works.</p>
          {d.welcome ? (
            <p className="welcome__ok">
              <CircleCheck aria-hidden /> Password changed. Welcome to your admin panel ✿
            </p>
          ) : null}
        </div>
        <p className="welcome__date">
          <CalendarHeart aria-hidden />
          <span>{d.today} · PH time</span>
        </p>
      </section>

      <div className="block-head">
        <Sticker as="h2" small>
          Site content
        </Sticker>
        {d.latest ? (
          <p className="block-head__note">
            Latest: <Link href={`/admin/projects/${d.latest.id}`}>{d.latest.title}</Link>
          </p>
        ) : null}
      </div>
      <div className="tiles">
        <Tile
          href="/admin/projects"
          icon={FolderKanban}
          label="Project History"
          value={p.published}
          unit="published"
          share={p.published + p.drafts ? p.published / (p.published + p.drafts) : 0}
          foot={p.drafts ? <span className="apill apill--draft">{plural(p.drafts, "draft", "drafts")}</span> : <span className="tile__ok">All published</span>}
        />
        <Tile
          href="/admin/certifications"
          icon={Award}
          label="Certifications"
          value={c.shown}
          unit="shown"
          share={c.shown + c.hidden ? c.shown / (c.shown + c.hidden) : 0}
          foot={
            c.hidden ? (
              <span className="apill apill--draft">{nf.format(c.hidden)} hidden</span>
            ) : (
              <span className="tile__ok">
                {plural(c.shown - c.grades, "certificate", "certificates")} · {plural(c.grades, "grade report", "grade reports")}
              </span>
            )
          }
        />
        <Tile
          href="/admin/tech"
          icon={Shapes}
          label="Tech catalog"
          value={d.tech.total}
          unit="technologies"
          share={d.tech.total ? d.tech.used / d.tech.total : 0}
          foot={<span className="tile__ok">{nf.format(d.tech.used)} used on the site</span>}
        />
        <Tile
          href="/admin/messages"
          icon={Mail}
          label="Messages"
          tone="messages"
          value={d.messages.unread}
          unit="unread"
          share={d.messages.inbox ? d.messages.unread / d.messages.inbox : 0}
          foot={<span className="tile__ok">{plural(d.messages.inbox, "message", "messages")} in the inbox</span>}
        />
      </div>

      <div className="block-head">
        <Sticker as="h2" small tone="lilac">
          Waiting for you
        </Sticker>
      </div>
      {waiting ? (
        <div className="wait-grid">
          <section className="panel">
            <h2>
              <Mail aria-hidden />
              <span>{d.messages.unread ? plural(d.messages.unread, "unread message", "unread messages") : "No unread messages"}</span>
            </h2>
            {d.unreadList.length ? (
              <ul className="mini-list">
                {d.unreadList.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/messages/${m.id}`} className="mini-list__row mini-list__row--msg">
                      <span className="bubble" style={{ background: bubbleColor(m.email) }} aria-hidden="true">
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="mini-list__text">
                        <strong>{m.name}</strong>
                        <span>{m.subject}</span>
                      </span>
                      <span className="mini-list__when">{relativeTime(m.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <StateBox small>The inbox is all read.</StateBox>
            )}
          </section>
          <section className="panel">
            <h2>
              <PencilLine aria-hidden />
              <span>{d.draftList.length ? plural(d.draftList.length, "draft project", "draft projects") : "No draft projects"}</span>
            </h2>
            {d.draftList.length ? (
              <ul className="mini-list">
                {d.draftList.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/projects/${x.id}`} className="mini-list__row mini-list__row--draft">
                      <span className="mini-list__text">
                        <strong>{x.title}</strong>
                        <span>last saved {relativeTime(x.updatedAt)}</span>
                      </span>
                      <span className="mini-list__go">
                        Continue <ArrowRight aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <StateBox small>Every project is published.</StateBox>
            )}
          </section>
        </div>
      ) : (
        <StateBox>Nothing is waiting for you ✿</StateBox>
      )}

      <div className="block-head">
        <Sticker as="h2" small tone="blue">
          Visitor statistics
        </Sticker>
        <p className="block-head__note">Visits to the live site, counted in PH time (weeks start on Monday).</p>
        <Link href="/admin/statistics" className="abtn abtn--ghost abtn--sm block-head__link">
          Full statistics <ArrowRight aria-hidden />
        </Link>
      </div>
      <div className="kpis">
        <KpiCard icon={Sun} label="Today" value={nf.format(d.visitors.today[0])} sub={plural(d.visitors.today[1], "unique visitor", "unique visitors")} />
        <KpiCard icon={CalendarDays} label="This week" value={nf.format(d.visitors.week[0])} sub={`${plural(d.visitors.week[1], "unique visitor", "unique visitors")} (per day)`} />
        <KpiCard icon={Calendar} label="This month" value={nf.format(d.visitors.month[0])} sub={`${plural(d.visitors.month[1], "unique visitor", "unique visitors")} (per day)`} />
      </div>
      <section className="panel">
        <VisitsChart series={d.visitors.series} range={30} />
      </section>

      <h3 className="group-title">
        <span>Recent activity</span>
        <Link href="/admin/activity" className="group-title__link">
          All activity <ArrowRight aria-hidden />
        </Link>
      </h3>
      {d.activity.length ? <ActivityList rows={d.activity} /> : <StateBox>Nothing yet.</StateBox>}
    </>
  );
}
