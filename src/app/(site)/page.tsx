import { Award, Code2, Sparkles, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Flower, GiantWord, PatternStage, RotatingBadge, Spark, Sticker, VerticalText } from "@/components/decor/Decor";
import { Marquee } from "@/components/decor/Marquee";
import { CldImg, TechChip } from "@/components/projects/bits";
import { LatestProject } from "@/components/projects/LatestProject";
import { ComingSoonCard, ProjectCard } from "@/components/projects/ProjectCard";
import { NewsTicker } from "@/components/site/NewsTicker";
import { SectionHead } from "@/components/site/SectionHead";
import { dotDate, isoDate, longDate, pad2 } from "@/lib/format";
import { site } from "@/lib/site";
import { buildToolbox, buildUpdates, getPublishedCertifications, getPublishedProjects } from "@/server/queries/public";
import "@/styles/home.css";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "Moesoft — a portfolio by Kyle Zoleta" },
  description: "Creative websites and the systems behind them: projects, notes and certifications by Kyle Zoleta.",
  alternates: { canonical: "/" },
};

const a = (beats: number) => ({ "--a": beats }) as CSSProperties;

export default async function Home() {
  const [projects, certs] = await Promise.all([getPublishedProjects(), getPublishedCertifications()]);
  const latest = projects[0];
  const updates = buildUpdates(projects, certs);
  const toolbox = buildToolbox(projects);
  const works = projects.slice(0, 5);
  const lastUpdate = updates[0]?.date;

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: site.name, alternateName: site.legalName, url: site.url, description: site.intro },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: site.owner,
      url: site.url,
      description: "Makes creative websites and the systems behind them, as Moesoft.",
      sameAs: site.socials.filter((s) => s.id !== "email").map((s) => s.href),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <NewsTicker items={updates.map((u) => ({ date: dotDate(u.date), iso: isoDate(u.date), text: u.text, href: u.href }))} />

      {/* ── Key-visual stage ── */}
      <PatternStage as="section" className="hero" aria-labelledby="hero-title" data-track-section="hero">
        <div className="hero__frame" aria-hidden="true">
          <span className="hero__corner hero__corner--tl">No.00 — Moesoft</span>
          <span className="hero__corner hero__corner--tr">{lastUpdate ? `Updated ${dotDate(lastUpdate)}` : `Est. ${site.since}`}</span>
          <span className="hero__corner hero__corner--bl">Scroll ✿</span>
          <span className="hero__corner hero__corner--br">PH · GMT+8</span>
        </div>

        <div className="hero__inner">
          <p className="micro micro--row hero__labels arrive" style={a(0.2)}>
            <span>
              <b>Est.</b> {site.since}
            </span>
            <span>Portfolio</span>
            <span>
              Projects <b>{pad2(projects.length)}</b>
            </span>
          </p>
          <h1 id="hero-title" className="hero__title">
            <span className="visually-hidden">Moesoft, a portfolio by Kyle Zoleta</span>
            <img className="hero__logo hero__logo--anim" src="/brand/moesoft-splash.svg" alt="" width={720} height={226} fetchPriority="high" />
            <img className="hero__logo hero__logo--static" src="/brand/moesoft-logo.svg" alt="" width={720} height={226} loading="lazy" />
          </h1>
          <div className="hero__copy">
            <p className="hero__by arrive" style={a(0.9)}>
              A portfolio by <strong>{site.owner}</strong>
            </p>
            <p className="hero__intro arrive" style={a(1.1)}>
              {site.intro}
            </p>
            <div className="hero__cta arrive" style={a(1.4)}>
              <Link className="btn" href="/history">
                See the projects
              </Link>
              <Link className="btn btn--white" href="/about">
                About me
              </Link>
            </div>
          </div>
        </div>

        <RotatingBadge id="hero-badge" text="MOESOFT ✿ PORTFOLIO ✿ SOFTWARE AND TECHNOLOGIES ✿ " className="hero__badge arrive--stick" size={150} />
        <VerticalText lines={["Software and", "Technologies", "Since 2026"]} className="hero__vtext arrive arrive--fade" />
        <img className="hero__sticker hero__sticker--pink float" src="/brand/flower-pink.svg" alt="" width={88} height={88} aria-hidden="true" style={{ "--d": -1 } as CSSProperties} />
        <img className="hero__sticker hero__sticker--purple float" src="/brand/flower-purple.svg" alt="" width={64} height={64} aria-hidden="true" style={{ "--d": -2.4 } as CSSProperties} />
        <Spark className="hero__spark hero__spark--a twinkle" size={22} color="var(--butter-300)" />
        <Spark className="hero__spark hero__spark--b twinkle" size={16} color="var(--pink-400)" style={{ "--d": -1.2 } as CSSProperties} />
        <Spark className="hero__spark hero__spark--c twinkle" size={18} color="var(--blue-400)" style={{ "--d": -0.6 } as CSSProperties} />
        <GiantWord className="hero__giant arrive--giant">MOESOFT</GiantWord>
      </PatternStage>

      {/* ── Latest project (overlaps the stage) ── */}
      {latest ? <LatestProject project={latest} /> : null}

      {/* ── Profile strip ── */}
      <section className="wrap section--tight profile" aria-label="Profile at a glance" data-track-section="profile">
        <ul className="profile__grid">
          <li className="profile__card paper paper--pad reveal">
            <p className="micro">
              <UserRound size={14} aria-hidden="true" /> Who
            </p>
            <p className="profile__value">{site.owner}</p>
            <p className="profile__sub">Making things as Moesoft</p>
          </li>
          <li className="profile__card paper paper--pad reveal">
            <p className="micro">
              <Sparkles size={14} aria-hidden="true" /> Makes
            </p>
            <p className="profile__value">Creative websites</p>
            <p className="profile__sub">Backends · Mobile apps · Desktop tools</p>
          </li>
          <li className="profile__card paper paper--pad reveal">
            <p className="micro">
              <Code2 size={14} aria-hidden="true" /> Focus
            </p>
            <p className="profile__value">Systems</p>
            <p className="profile__sub">Analysis · Integration · Operations</p>
          </li>
          <li className="profile__card profile__card--numbers paper paper--pad paper--dots reveal">
            <p className="micro">
              <Award size={14} aria-hidden="true" /> Numbers
            </p>
            <dl className="profile__nums">
              <div>
                <dt>Projects</dt>
                <dd>{pad2(projects.length)}</dd>
              </div>
              <div>
                <dt>Certifications</dt>
                <dd>{pad2(certs.length)}</dd>
              </div>
              <div>
                <dt>Since</dt>
                <dd>{site.since}</dd>
              </div>
            </dl>
          </li>
        </ul>
      </section>

      {/* ── No.02 — WORKS ── */}
      <section className="wrap section works" aria-labelledby="works-title" data-track-section="works">
        <SectionHead
          no="No.02"
          label="Works"
          title="Works"
          id="works-title"
          action={
            <Link className="more more--caps" href="/history">
              View all history »
            </Link>
          }
        />
        <div className="works__grid">
          {works.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={projects.length - i} featured={i === 0} latest={i === 0} from="home-works" />
          ))}
          {works.length < 3 ? <ComingSoonCard /> : null}
        </div>
      </section>

      {/* ── No.03 — TOOLBOX ── */}
      {toolbox.length ? (
        <section className="section toolbox" aria-labelledby="toolbox-title" data-track-section="toolbox">
          <div className="wrap">
            <SectionHead no="No.03" label="Toolbox" title="Toolbox" id="toolbox-title" intro="The tools behind the published projects. The number shows how many projects use each one." />
          </div>
          <Marquee className="toolbox__marquee" label="Technologies used in published projects">
            {toolbox.map((t) => (
              <TechChip key={t.id} tech={t} size="lg" count={t.projects} />
            ))}
          </Marquee>
        </section>
      ) : null}

      {/* ── No.04 — CERTIFICATIONS (hidden while empty) ── */}
      {certs.length ? (
        <section className="wrap section certs" aria-labelledby="certs-title" data-track-section="certifications">
          <SectionHead
            no="No.04"
            label="Certifications"
            title="Certifications"
            id="certs-title"
            action={
              <Link className="more more--caps" href="/about#certifications">
                See all »
              </Link>
            }
          />
          <ul className="certs__strip">
            {certs.slice(0, 8).map((c) => (
              <li key={c.id} className="certs__item paper reveal">
                <Link href="/about#certifications">
                  <span className="certs__img">
                    <CldImg media={c.media} sizes="240px" maxWidth={720} />
                  </span>
                  <span className="certs__title">{c.title}</span>
                  <time className="micro" dateTime={isoDate(c.obtainedOn)}>
                    Obtained {longDate(c.obtainedOn)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── No.05 — NEWS ── */}
      <section className="wrap section news" id="news" aria-labelledby="news-title" data-track-section="news">
        <SectionHead no={certs.length ? "No.05" : "No.04"} label="News" title="News" id="news-title" />
        {updates.length ? (
          <ol className="newslist">
            {updates.slice(0, 5).map((u, i) => (
              <li key={i} className="newslist__row reveal">
                <time className="newslist__date" dateTime={isoDate(u.date)}>
                  {dotDate(u.date)}
                </time>
                <span className={`chip ${u.kind === "project" ? "chip--pink" : "chip--blue"}`}>{u.kind === "project" ? "Project" : "Certification"}</span>
                <Link className="newslist__text" href={u.href}>
                  {u.text}
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="note">
            <Flower size={18} /> Nothing new yet. The first project is on its way ✿
          </p>
        )}
      </section>

      {/* ── Contact banner ── */}
      <section className="wrap section--tight" data-track-section="contact">
        <div className="cbanner reveal">
          <div className="cbanner__text">
            <p className="micro">Contact</p>
            <p className="cbanner__title">Questions about me or my projects? ✿</p>
            <p className="cbanner__sub">{site.replyNote}</p>
          </div>
          <Link className="btn btn--white cbanner__btn" href="/contact">
            Say hello →
          </Link>
          <Sticker tone="butter" tilt={10} className="cbanner__sticker" decorative>
            ✿ Hello!
          </Sticker>
          <img className="cbanner__flower float" src="/brand/flower-purple.svg" alt="" width={90} height={90} aria-hidden="true" loading="lazy" />
        </div>
      </section>
    </>
  );
}
