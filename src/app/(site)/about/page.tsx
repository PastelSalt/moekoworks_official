import { MonitorSmartphone, Palette, Server, Workflow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Flower, Sticker, Tape } from "@/components/decor/Decor";
import { CldImg, TechChip } from "@/components/projects/bits";
import { Lightbox } from "@/components/projects/Lightbox";
import { PageHead } from "@/components/site/PageHead";
import { SectionHead } from "@/components/site/SectionHead";
import { cldImage, cldSrcSet } from "@/lib/cloudinary";
import { isoDate, longDate, monthYear, pad2 } from "@/lib/format";
import { base, breadcrumbs, graph, ids, ldHtml, personNode, websiteNode } from "@/lib/seo";
import { site } from "@/lib/site";
import { getPublishedCertifications, getToolbox } from "@/server/queries/public";
import "@/styles/pages.css";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "About Kyle Zoleta",
  description: "Who Kyle Zoleta is, what Moeko Works makes, the toolbox and certifications.",
  alternates: { canonical: "/about" },
};

const MAKES = [
  { icon: Palette, title: "Creative websites", body: "Fan sites, VTuber, character and anime-themed sites, galleries and event pages that move smoothly and get the little details right.", tone: "pink", main: true },
  { icon: Server, title: "The backends behind them", body: "Admin panels, databases, sign-in, uploads and analytics, so content can be updated without touching code.", tone: "blue" },
  { icon: MonitorSmartphone, title: "Beyond the browser", body: "Mobile apps, and smaller desktop tools when a project needs them.", tone: "lilac" },
  { icon: Workflow, title: "Systems work", body: "Figuring out how things should work, connecting the pieces, and keeping them running.", tone: "butter" },
] as const;

const CATEGORY_ORDER: [string, string][] = [
  ["language", "Languages"],
  ["framework", "Frameworks"],
  ["library", "Libraries"],
  ["runtime", "Runtimes"],
  ["database", "Databases"],
  ["cloud", "Cloud & hosting"],
  ["service", "Services"],
  ["platform", "Platforms"],
  ["tool", "Tools"],
  ["design", "Design"],
  ["other", "Other"],
];

/** Term grade reports are certifications titled "Grades: …"; they get the grading-scale note and show the term's month. */
const isGrades = (title: string) => /^Grades\b/.test(title);

const GRADE_SCALE = [
  ["4.00", "Excellent", "96–100%"],
  ["3.50", "Very good", "90–95%"],
  ["3.00", "Good", "84–89%"],
  ["2.50", "Above satisfactory", "78–83%"],
  ["2.00", "Satisfactory", "72–77%"],
  ["1.50", "Fair", "66–71%"],
  ["1.00", "Pass", "60–65%"],
  ["0.00", "Fail", ""],
] as const;

export default async function AboutPage() {
  const [certs, toolbox] = await Promise.all([getPublishedCertifications(), getToolbox()]);
  const hasGrades = certs.some((c) => isGrades(c.title));
  const groups = CATEGORY_ORDER.map(([key, label]) => ({ key, label, items: toolbox.filter((t) => t.category === key) })).filter((g) => g.items.length);

  // AboutPage whose main entity is the Person: the page search engines read for "Kyle Zoleta", with the toolbox
  // as what he knows and the certifications as credentials.
  const used = toolbox.filter((t) => t.projects > 0).map((t) => t.name);
  const jsonLd = graph(
    {
      "@type": "AboutPage",
      "@id": `${base}/about#page`,
      url: `${base}/about`,
      name: `About ${site.owner} · ${site.name}`,
      isPartOf: { "@id": ids.website },
      mainEntity: { "@id": ids.person },
      breadcrumb: breadcrumbs([
        { name: site.name, path: "/" },
        { name: "About", path: "/about" },
      ]),
    },
    {
      ...personNode(used),
      ...(certs.length
        ? {
            hasCredential: certs.map((c) => ({
              "@type": "EducationalOccupationalCredential",
              name: c.title,
              dateCreated: c.obtainedOn,
            })),
          }
        : {}),
    },
    websiteNode(),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldHtml(jsonLd)} />
      <PageHead
        label="About"
        title="About Moeko Works"
        giant="ABOUT"
        micro={
          <>
            <span>
              <b>No.01</b> Profile
            </span>
            <span>Since {site.since}</span>
            <span>PH · GMT+8</span>
          </>
        }
      >
        <p>The person, the toolbox and the certificates behind Moeko Works.</p>
      </PageHead>

      {/* No.01 — PROFILE */}
      <section className="wrap section about-profile" aria-labelledby="profile-title">
        <SectionHead no="No.01" label="Profile" title="Profile" id="profile-title" />
        <div className="about-profile__grid">
          <div className="paper paper--pad about-profile__intro reveal">
            <Tape tone="pink" className="about-profile__tape" />
            <p className="about-profile__hello">Hi, I&apos;m {site.owner} ✿</p>
            <p>
              Moeko Works is the name I make things under. I build websites from the first sketch to launch day, and I&apos;m happiest when a project has personality: a character, a fandom, a
              world worth showing off.
            </p>
            <p>Behind the playful side there&apos;s a dependable one. Most of my strength is in the backend, in systems analysis, integration and operations, so everything keeps working long after launch.</p>
          </div>
          <dl className="facts paper reveal">
            <div>
              <dt>Name</dt>
              <dd>{site.owner}</dd>
            </div>
            <div>
              <dt>Makes things as</dt>
              <dd>
                {site.name}
              </dd>
            </div>
            <div>
              <dt>What I do</dt>
              <dd>Creative websites, and the systems behind them</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Backend · Systems analysis · Integration · Operations</dd>
            </div>
            <div>
              <dt>Also</dt>
              <dd>Mobile apps · Desktop tools</dd>
            </div>
            <div>
              <dt>Based in</dt>
              <dd>Philippines (GMT+8)</dd>
            </div>
            <div>
              <dt>Since</dt>
              <dd>{site.since}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* No.02 — WHAT I MAKE */}
      <section className="wrap section--tight makes" aria-labelledby="makes-title">
        <SectionHead no="No.02" label="What I make" title="What I make" id="makes-title" />
        <ul className="makes__grid">
          {MAKES.map((m, i) => (
            <li key={m.title} className={`makes__tile makes__tile--${m.tone} paper reveal`}>
              <span className="makes__no" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <span className="makes__icon" aria-hidden="true">
                <m.icon size={26} strokeWidth={1.9} />
              </span>
              <h3 className="makes__title">{m.title}</h3>
              <p className="makes__body">{m.body}</p>
              {"main" in m && m.main ? (
                <Sticker tone="butter" tilt={8} className="makes__sticker" decorative>
                  Main
                </Sticker>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* No.03 — TOOLBOX */}
      <section className="wrap section toolbox-groups" aria-labelledby="toolbox-title">
        <SectionHead no="No.03" label="Toolbox" title="Toolbox" id="toolbox-title" intro="What I build with, grouped by kind. A number shows how many published projects use it." />
        {groups.length ? (
          <div className="toolbox-groups__grid">
            {groups.map((g) => (
              <div key={g.key} className="toolbox-groups__group paper paper--pad reveal">
                <p className="micro">
                  <b>{pad2(g.items.length)}</b> {g.label}
                </p>
                <ul className="toolbox-groups__list">
                  {g.items.map((t) => (
                    <li key={t.id}>
                      <TechChip tech={t} count={t.projects || undefined} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="note">
            <Flower size={18} /> The toolbox is being unpacked ✿
          </p>
        )}
      </section>

      {/* No.04 — CERTIFICATIONS */}
      <section className="wrap section certifications" id="certifications" aria-labelledby="certs-title">
        <SectionHead no="No.04" label="Certifications" title="Certifications" id="certs-title" intro="Courses, certificates and my term grades, newest first." />
        {certs.length ? (
          <>
          <Lightbox
            className="certgrid"
            label="Certificate viewer"
            items={certs.map((c) => ({
              src: cldImage(c.media.publicId, { w: 1600 }),
              srcSet: cldSrcSet(c.media.publicId, [800, 1200, 1600, 2000]),
              alt: c.media.altText ?? `Certificate: ${c.title}`,
              caption: isGrades(c.title) ? `${c.title} · 4.00 is the highest grade (see the note below the certificates)` : `${c.title} · obtained ${longDate(c.obtainedOn)}`,
              width: c.media.width,
              height: c.media.height,
              track: { t: "certificate_open" as const, id: c.id },
            }))}
          >
            <ul className="certgrid__list">
              {certs.map((c, i) => (
                <li key={c.id} className="cert paper reveal">
                  <Tape tone={(["pink", "blue", "lilac", "butter"] as const)[i % 4]} className="cert__tape" />
                  <button type="button" className="cert__open" data-lb={i} aria-label={`View certificate: ${c.title}`}>
                    <span className="cert__frame">
                      <CldImg media={{ ...c.media, altText: c.media.altText ?? `Certificate: ${c.title}` }} sizes="(min-width: 900px) 30vw, 90vw" maxWidth={1200} />
                    </span>
                  </button>
                  <div className="cert__body">
                    <h3 className="cert__title">{c.title}</h3>
                    {isGrades(c.title) ? (
                      <p className="micro micro--row">
                        <span>
                          Term ended <time dateTime={isoDate(c.obtainedOn)}>{monthYear(c.obtainedOn)}</time>
                        </span>
                        <a href="#grading-scale">4.00 is the highest</a>
                      </p>
                    ) : (
                      <p className="micro">
                        Obtained <time dateTime={isoDate(c.obtainedOn)}>{longDate(c.obtainedOn)}</time>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Lightbox>
          {hasGrades ? (
            <aside className="grade-note paper paper--pad" id="grading-scale" aria-labelledby="grading-scale-title">
              <h3 id="grading-scale-title" className="grade-note__title">
                <Flower size={18} /> How to read my grades
              </h3>
              <p>
                <strong>4.00 is the highest grade, not the lowest.</strong> National University uses a zero-based 4.00 scale that runs the opposite way to the 1.00-is-best scale most
                Philippine schools use. So a GWA (general weighted average) of 3.90 sits near the top, not near failing.
              </p>
              <dl className="grade-note__scale">
                {GRADE_SCALE.map(([grade, meaning, range]) => (
                  <div key={grade}>
                    <dt>{grade}</dt>
                    <dd>
                      {meaning} {range ? <span>{range}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
              <p>
                <strong>Only the final grade counts.</strong> Each final grade already covers the whole term, midterm and finals together, and it is the grade used for the GWA. In CCIT
                (the College of Computing and Information Technologies, home of BSIT), computing and IT courses are graded continuously and by output: the term&apos;s work builds toward a
                project that is only finished and submitted in the finals, so there is nothing complete to grade at midterm. That is why those courses show &ldquo;Inc&rdquo; in the Midterm
                column; it is not an incomplete course, and every one of them has its final grade.
              </p>
              <p className="micro">Student ID hidden · subjects marked * (NSTP) are not counted in the GWA, as on the official report</p>
            </aside>
          ) : null}
          </>
        ) : (
          <p className="note">
            <Flower size={18} /> Certificates will appear here soon ✿
          </p>
        )}
      </section>

      <section className="wrap section--tight about-next">
        <div className="about-next__row">
          <Link className="btn" href="/history">
            See my projects →
          </Link>
          <Link className="btn btn--blue" href="/contact">
            Ask me something
          </Link>
        </div>
      </section>
    </>
  );
}
