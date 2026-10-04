import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { GiantWord, PatternStage, PopText, RotatingBadge, Spark, Tape } from "@/components/decor/Decor";
import { Marquee } from "@/components/decor/Marquee";
import { CldImg, DeviceFrame, frameFor, StatusChip, TechChip, TechIcons } from "@/components/projects/bits";
import { Lightbox } from "@/components/projects/Lightbox";
import { primaryLink } from "@/components/projects/LatestProject";
import { PreviewVideo } from "@/components/projects/PreviewVideo";
import { ComingSoonTicket, Ticket } from "@/components/projects/Tickets";
import { SectionHead } from "@/components/site/SectionHead";
import { cldImage, cldSrcSet, cldVideo } from "@/lib/cloudinary";
import { accentVars } from "@/lib/color";
import { CATEGORY_LABEL, dotDate, isoDate, LIFECYCLE_LABEL, no, pad2, PLATFORM_LABEL, timeline } from "@/lib/format";
import { Markdown, markdownToText } from "@/lib/markdown";
import { opIcon } from "@/lib/op-icons";
import { site } from "@/lib/site";
import { getProjectBySlug, getPublishedProjects, type Operation } from "@/server/queries/public";
import "@/styles/project.css";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getPublishedProjects()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/history/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "Project not found" };
  return {
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.tagline,
    alternates: { canonical: `/history/${p.slug}` },
    openGraph: { type: "article", title: `${p.title} · ${site.name}`, description: p.tagline, images: p.cover ? [{ url: cldImage(p.cover.publicId, { w: 1200, h: 630, crop: "fill", gravity: "auto" }), width: 1200, height: 630 }] : undefined },
  };
}

const TECH_GROUPS: [string, string][] = [
  ["language", "Languages"],
  ["framework", "Frameworks"],
  ["library", "Libraries"],
  ["runtime", "Runtimes"],
  ["database", "Data"],
  ["cloud", "Cloud & hosting"],
  ["service", "Services"],
  ["platform", "Platforms"],
  ["tool", "Tools"],
  ["design", "Design"],
  ["other", "Other"],
];

function Operations({ items, tone }: { items: Operation[]; tone: "visitor" | "admin" | "system" }) {
  return (
    <ol className={`ops ops--${tone}`}>
      {items.map((op, i) => {
        const Icon = opIcon(op.icon);
        return (
          <li key={op.id} id={`op-${op.id}`} className={`op ${op.media ? "op--media" : ""} reveal`}>
            <div className="op__text">
              <div className="op__head">
                <span className="op__no" aria-hidden="true">
                  {pad2(i + 1)}
                </span>
                <span className="op__icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
              </div>
              <h3 className="op__title">
                {op.title}
                <a className="op__anchor" href={`#op-${op.id}`} aria-label={`Link to “${op.title}”`}>
                  #
                </a>
              </h3>
              <Markdown source={op.bodyMd} className="op__body prose" />
            </div>
            {op.media ? (
              <figure className="op__media">
                <DeviceFrame kind={frameFor(op.media)}>
                  <CldImg media={op.media} sizes="(min-width: 1100px) 44vw, 92vw" />
                </DeviceFrame>
                {op.media.caption ? <figcaption className="op__caption">{op.media.caption}</figcaption> : null}
              </figure>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default async function ProjectPage({ params }: PageProps<"/history/[slug]">) {
  const { slug } = await params;
  const [p, all] = await Promise.all([getProjectBySlug(slug), getPublishedProjects()]);
  if (!p) notFound();

  const position = all.findIndex((x) => x.id === p.id);
  const number = position >= 0 ? all.length - position : 1;
  const newer = position > 0 ? all[position - 1] : null;
  const older = position >= 0 && position < all.length - 1 ? all[position + 1] : null;
  const live = primaryLink(p);
  const visitors = p.operations.filter((o) => o.audience === "visitor");
  const admins = p.operations.filter((o) => o.audience === "admin");
  const system = p.operations.filter((o) => o.audience === "system");
  const groups = TECH_GROUPS.map(([key, label]) => ({ label, items: p.tech.filter((t) => t.category === key) })).filter((g) => g.items.length);
  const words = markdownToText(p.descriptionMd).split(" ").filter(Boolean).length;
  const status = LIFECYCLE_LABEL[p.lifecycle]?.label ?? p.lifecycle;
  const heroMedia = p.cover ?? p.gallery[0] ?? null;
  const giant = p.title.split(" ")[0].toUpperCase();

  // Sections number themselves in the order they appear (empty ones disappear cleanly).
  let n = 0;
  const next = () => `No.${pad2(++n)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": p.category === "web" ? "WebSite" : p.category === "mobile" || p.category === "desktop" ? "SoftwareApplication" : "CreativeWork",
    name: p.title,
    description: p.tagline,
    url: live?.url,
    author: { "@type": "Person", name: site.owner },
    dateCreated: p.startedOn ?? undefined,
    datePublished: p.publishedAt?.toISOString(),
    image: heroMedia ? cldImage(heroMedia.publicId, { w: 1200 }) : undefined,
    keywords: p.tech.map((t) => t.name).join(", "),
  };

  return (
    <article className="project" style={accentVars(p)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ── Key-visual hero ── */}
      <PatternStage as="header" className="phero stage--accent">
        {heroMedia ? <span className="phero__ambient" aria-hidden="true" style={{ backgroundImage: `url(${cldImage(heroMedia.publicId, { w: 480 })})` }} /> : null}
        <p className="phead__label arrive arrive--fade" aria-hidden="true">
          <Spark size={12} color="var(--project-accent-strong)" /> History · {no(number)}
        </p>
        <div className="wrap phero__grid">
          <div className="phero__text">
            <p className="micro micro--row arrive" style={{ "--a": 0.2 } as CSSProperties}>
              <b>{no(number)}</b>
              <span>{CATEGORY_LABEL[p.category] ?? p.category}</span>
              {p.publishedAt ? <time dateTime={isoDate(p.publishedAt)}>{dotDate(p.publishedAt)}</time> : null}
            </p>
            <h1 className="phero__title">
              <PopText text={p.title} load />
            </h1>
            <p className="ribbon-banner arrive" style={{ "--a": 1 } as CSSProperties}>
              <span>{p.tagline}</span>
            </p>
            <ul className="chips arrive" style={{ "--a": 1.3 } as CSSProperties}>
              <li>
                <StatusChip lifecycle={p.lifecycle} />
              </li>
              {p.platforms.map((pl) => (
                <li key={pl} className="chip chip--accent">
                  {PLATFORM_LABEL[pl] ?? pl}
                </li>
              ))}
              {p.startedOn ? <li className="chip chip--white">{timeline(p.startedOn, p.finishedOn, p.lifecycle)}</li> : null}
            </ul>
            <div className="phero__cta arrive" style={{ "--a": 1.6 } as CSSProperties}>
              {live ? <Ticket link={live} compact /> : <ComingSoonTicket />}
              <a className="more" href="#overview">
                read more <ChevronDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="phero__media arrive arrive--drop" style={{ "--a": 0.6 } as CSSProperties}>
            <DeviceFrame kind="browser" url={live?.kind === "live" ? live.url : undefined} className="phero__frame">
              {p.preview ? (
                <PreviewVideo mode="inview" src={cldVideo.mp4(p.preview.publicId)} webm={cldVideo.webm(p.preview.publicId)} poster={heroMedia ? undefined : cldVideo.poster(p.preview.publicId)} className="phero__video" label={`Preview of ${p.title}`} />
              ) : null}
              {heroMedia ? <CldImg media={heroMedia} sizes="(min-width: 1100px) 56vw, 100vw" className="phero__img" priority /> : <span className="phero__art" aria-hidden="true" />}
            </DeviceFrame>
            <Tape tone="pink" className="phero__tape phero__tape--a arrive--stick" />
            <Tape tone="butter" className="phero__tape phero__tape--b arrive--stick" />
            {live?.kind === "live" ? <RotatingBadge id="visit-badge" text="VISIT ✿ VISIT ✿ VISIT ✿ VISIT ✿ " href={live.url} label={`Visit ${p.title} (opens in a new tab)`} className="phero__badge badge--accent arrive--stick" size={120} /> : null}
          </div>
        </div>
        <GiantWord tone="white" className="phero__giant arrive--giant">
          {giant}
        </GiantWord>
      </PatternStage>

      {/* ── Sticky mini-bar ── */}
      <div className="pbar">
        <div className="wrap pbar__inner">
          <Link className="pbar__back" href="/history" aria-label="Back to History">
            <ArrowLeft size={16} aria-hidden="true" /> History
          </Link>
          <p className="pbar__title">{p.title}</p>
          {live ? (
            <a className="pbar__visit" href={live.url} target="_blank" rel="noopener noreferrer">
              {live.kind === "live" ? "Visit" : "Open"} <span aria-hidden="true">↗</span>
              <span className="visually-hidden"> {p.title} (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* ── INFO sheet ── */}
      <section className="wrap section--tight info" aria-labelledby="info-title">
        <h2 id="info-title" className="visually-hidden">
          Info
        </h2>
        <dl className="info__sheet paper reveal">
          <div>
            <dt>Type</dt>
            <dd>{CATEGORY_LABEL[p.category] ?? p.category}</dd>
          </div>
          <div>
            <dt>Platform</dt>
            <dd>{p.platforms.length ? p.platforms.map((x) => PLATFORM_LABEL[x] ?? x).join(" · ") : "—"}</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>{timeline(p.startedOn, p.finishedOn, p.lifecycle) || "—"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{p.role || "—"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusChip lifecycle={p.lifecycle} className="chip--accent" />
              <span className="visually-hidden">{status}</span>
            </dd>
          </div>
          <div className="info__tech">
            <dt>Built with</dt>
            <dd>{p.tech.length ? <TechIcons tech={p.tech} max={12} /> : "—"}</dd>
          </div>
        </dl>
      </section>

      {/* ── OVERVIEW ── */}
      {p.descriptionMd.trim() ? (
        <section className="wrap section overview" id="overview" aria-labelledby="overview-title">
          <SectionHead no={next()} label="Overview" title="Overview" id="overview-title" />
          <div className="overview__card paper paper--pad reveal">
            <Tape tone="lilac" className="overview__tape" />
            {words > 600 ? (
              <details className="overview__more">
                <summary>Read the full story</summary>
                <Markdown source={p.descriptionMd} className="prose overview__prose" />
              </details>
            ) : (
              <Markdown source={p.descriptionMd} className="prose overview__prose" />
            )}
          </div>
        </section>
      ) : null}

      {visitors.length ? (
        <section className="wrap section" aria-labelledby="ops-visitor">
          <SectionHead no={next()} label="What you can do" title="What you can do" id="ops-visitor" />
          <Operations items={visitors} tone="visitor" />
        </section>
      ) : null}

      {admins.length ? (
        <section className="wrap section" aria-labelledby="ops-admin">
          <SectionHead no={next()} label="For admins" title="For admins" id="ops-admin" />
          <Operations items={admins} tone="admin" />
        </section>
      ) : null}

      {system.length ? (
        <section className="wrap section" aria-labelledby="ops-system">
          <SectionHead no={next()} label="Behind the scenes" title="Behind the scenes" id="ops-system" />
          <Operations items={system} tone="system" />
        </section>
      ) : null}

      {/* ── BUILT WITH ── */}
      {groups.length ? (
        <section className="section builtwith" aria-labelledby="built-title">
          <div className="wrap">
            <SectionHead no={next()} label="Built with" title="Built with" id="built-title" />
          </div>
          <Marquee className="ribbon builtwith__ribbon">
            {p.tech.map((t) => (
              <span key={t.id} className="ribbon__item">
                {t.name} <span aria-hidden="true">✿</span>
              </span>
            ))}
          </Marquee>
          <div className="wrap builtwith__grid">
            {groups.map((g) => (
              <div key={g.label} className="builtwith__group paper paper--pad reveal">
                <p className="micro">
                  <b>{pad2(g.items.length)}</b> {g.label}
                </p>
                <ul className="builtwith__list">
                  {g.items.map((t) => (
                    <li key={t.id}>
                      <TechChip tech={t} />
                      {t.usageNote ? <span className="builtwith__note">{t.usageNote}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── GALLERY ── */}
      {p.gallery.length ? (
        <section className="wrap section gallery" aria-labelledby="gallery-title">
          <SectionHead no={next()} label="Gallery" title="Gallery" id="gallery-title" />
          <Lightbox
            label={`${p.title} gallery`}
            items={p.gallery.map((m) => ({
              src: cldImage(m.publicId, { w: 1920 }),
              srcSet: cldSrcSet(m.publicId, [960, 1440, 1920, 2560]),
              alt: m.altText ?? "",
              caption: m.caption ?? undefined,
              width: m.width,
              height: m.height,
            }))}
          >
            <ul className={`gallery__grid ${p.gallery.length === 1 ? "gallery__grid--one" : ""}`}>
              {p.gallery.map((m, i) => (
                <li key={m.id} className={`gallery__item gallery__item--${frameFor(m)} reveal`}>
                  <button type="button" className="gallery__open" data-lb={i} aria-label={`Open image ${i + 1}: ${m.altText ?? p.title}`}>
                    <DeviceFrame kind={frameFor(m)}>
                      <CldImg media={m} sizes={frameFor(m) === "phone" ? "(min-width: 900px) 18vw, 45vw" : "(min-width: 900px) 40vw, 92vw"} />
                    </DeviceFrame>
                  </button>
                  {m.caption ? <p className="gallery__caption">{m.caption}</p> : null}
                </li>
              ))}
            </ul>
          </Lightbox>
        </section>
      ) : null}

      {/* ── ACCESS ── */}
      <section className="wrap section access" aria-labelledby="access-title">
        <SectionHead label="Access" title="Access" id="access-title" />
        <div className="access__tickets">{p.links.length ? p.links.map((l) => <Ticket key={l.url} link={l} />) : <ComingSoonTicket />}</div>
      </section>

      {/* ── CREDITS & DISCLAIMER ── */}
      {p.credits.length || p.disclaimerMd ? (
        <section className="wrap section--tight credits" aria-labelledby="credits-title">
          <SectionHead label="Credits & disclaimer" title="Credits & disclaimer" id="credits-title" as="h2" />
          <div className="credits__card paper paper--pad paper--dots reveal">
            {p.credits.length ? (
              <ul className="credits__list">
                {p.credits.map((c) => (
                  <li key={c.name + (c.role ?? "")}>
                    <span className="micro">{c.role ?? "Credit"}</span>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer">
                        {c.name}
                      </a>
                    ) : (
                      <span>{c.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            <Markdown source={p.disclaimerMd} className="prose credits__disclaimer" />
          </div>
        </section>
      ) : null}

      {/* ── Previous / next ── */}
      <nav className="wrap section pnav" aria-label="More projects">
        {newer ? (
          <Link className="pnav__link pnav__link--prev paper" href={`/history/${newer.slug}`}>
            <span className="micro">
              <ArrowLeft size={14} aria-hidden="true" /> Newer project
            </span>
            <span className="pnav__title">{newer.title}</span>
          </Link>
        ) : (
          <span />
        )}
        <Link className="btn btn--white pnav__all" href="/history">
          Back to History
        </Link>
        {older ? (
          <Link className="pnav__link pnav__link--next paper" href={`/history/${older.slug}`}>
            <span className="micro">
              Older project <ArrowRight size={14} aria-hidden="true" />
            </span>
            <span className="pnav__title">{older.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
