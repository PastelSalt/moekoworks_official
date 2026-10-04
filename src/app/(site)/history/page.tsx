import type { Metadata } from "next";
import Link from "next/link";
import { Flower, GiantWord, Sticker } from "@/components/decor/Decor";
import { CldImg, StatusChip, TechIcons } from "@/components/projects/bits";
import { HoverPreview } from "@/components/projects/HoverPreview";
import { PageHead } from "@/components/site/PageHead";
import { cldImage, cldVideo, hoverUrl } from "@/lib/cloudinary";
import { accentVars } from "@/lib/color";
import { CATEGORY_LABEL, dotDate, isoDate, no, pad2, yearOf } from "@/lib/format";
import { getPublishedProjects, type ProjectSummary } from "@/server/queries/public";
import "@/styles/pages.css";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Project History",
  description: "Every project made under Moesoft, newest first.",
  alternates: { canonical: "/history" },
};

export default async function HistoryPage() {
  const projects = await getPublishedProjects();
  const years = new Map<string, { project: ProjectSummary; n: number }[]>();
  projects.forEach((p, i) => {
    const y = yearOf(p.publishedAt) || "—";
    years.set(y, [...(years.get(y) ?? []), { project: p, n: projects.length - i }]);
  });

  return (
    <>
      <PageHead
        label="History"
        title="Moesoft History"
        giant="HISTORY"
        micro={
          <>
            <span>
              <b>No.03</b> Projects
            </span>
            <span>{pad2(projects.length)} entries</span>
            <span>Newest first</span>
          </>
        }
      >
        <p>Every project made under Moesoft, newest first. Hover a project for a quick preview, or open it to see what it does, how it works and what it&apos;s made with.</p>
      </PageHead>

      <section className="wrap section history" aria-label="Project archive">
        {projects.length ? (
          <HoverPreview>
            {[...years.entries()].map(([year, rows]) => (
              <div key={year} className="hyear">
                <h2 className="hyear__label">
                  <span className="visually-hidden">Projects from {year}</span>
                  <GiantWord tone="pink" className="hyear__giant">
                    {year}
                  </GiantWord>
                  <span className="hyear__count" aria-hidden="true">
                    {pad2(rows.length)} {rows.length === 1 ? "project" : "projects"}
                  </span>
                </h2>
                <table className="htable">
                  <thead>
                    <tr>
                      <th scope="col">No.</th>
                      <th scope="col">Project</th>
                      <th scope="col">Date</th>
                      <th scope="col">Type</th>
                      <th scope="col">Built with</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ project: p, n }) => (
                      <tr
                        key={p.id}
                        className="hrow reveal"
                        data-row
                        data-title={p.title}
                        data-preview={hoverUrl(p)}
                        data-poster={p.cover ? cldImage(p.cover.publicId, { w: 640 }) : p.preview ? cldVideo.poster(p.preview.publicId) : undefined}
                        style={accentVars(p)}
                      >
                        <td className="hrow__no">{no(n)}</td>
                        <td className="hrow__project">
                          {p.cover ? (
                            <span className="hrow__thumb">
                              <CldImg media={p.cover} sizes="(max-width: 760px) 92vw, 1px" maxWidth={960} />
                            </span>
                          ) : null}
                          <Link className="hrow__title" href={`/history/${p.slug}`}>
                            {p.title}
                          </Link>
                          {n === projects.length ? (
                            <Sticker tone="butter" tilt={-6} className="hrow__latest">
                              Latest
                            </Sticker>
                          ) : null}
                          <span className="hrow__tagline">{p.tagline}</span>
                        </td>
                        <td className="hrow__date">
                          {p.publishedAt ? <time dateTime={isoDate(p.publishedAt)}>{dotDate(p.publishedAt)}</time> : "—"}
                        </td>
                        <td className="hrow__type">{CATEGORY_LABEL[p.category] ?? p.category}</td>
                        <td className="hrow__tech">
                          <TechIcons tech={p.tech} max={6} />
                        </td>
                        <td className="hrow__status">
                          <StatusChip lifecycle={p.lifecycle} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </HoverPreview>
        ) : (
          <p className="note">
            <Flower size={18} /> The first project is on its way ✿
          </p>
        )}
      </section>
    </>
  );
}
