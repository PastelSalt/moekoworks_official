import Link from "next/link";
import type { CSSProperties } from "react";
import { RotatingBadge, Tape } from "@/components/decor/Decor";
import { cldVideo } from "@/lib/cloudinary";
import { accentVars } from "@/lib/color";
import { CATEGORY_LABEL, dotDate, isoDate, no, yearOf } from "@/lib/format";
import type { ProjectSummary } from "@/server/queries/public";
import { CldImg, DeviceFrame, StatusChip } from "./bits";
import { PreviewVideo } from "./PreviewVideo";

export function primaryLink(project: Pick<ProjectSummary, "links" | "category">) {
  return project.links.find((l) => l.isPrimary) ?? project.links.find((l) => l.kind === "live") ?? project.links[0] ?? null;
}

/** Miku Expo featured card: autoplaying preview in a browser frame, the title plate overlapping it, VISIT badge. */
export function LatestProject({ project }: { project: ProjectSummary }) {
  const href = `/history/${project.slug}`;
  const live = primaryLink(project);
  return (
    <section className="latest wrap" aria-labelledby="latest-title" style={accentVars(project)}>
      <div className="latest__grid">
        <div className="latest__media arrive arrive--drop" style={{ "--a": 0.8 } as CSSProperties}>
          <DeviceFrame kind="browser" url={live?.kind === "live" ? live.url : undefined} className="latest__frame">
            {project.preview ? (
              <PreviewVideo
                mode="inview"
                src={cldVideo.mp4(project.preview.publicId)}
                webm={cldVideo.webm(project.preview.publicId)}
                poster={project.cover ? undefined : cldVideo.poster(project.preview.publicId)}
                className="latest__video"
                label={`Preview of ${project.title}`}
              />
            ) : null}
            {project.cover ? <CldImg media={project.cover} sizes="(min-width: 900px) 62vw, 100vw" className="latest__img" priority /> : null}
          </DeviceFrame>
          <Tape tone="pink" className="latest__tape latest__tape--a arrive--stick" />
          <Tape tone="blue" className="latest__tape latest__tape--b arrive--stick" />
        </div>

        <div className="latest__plate paper arrive" style={{ "--a": 1.4 } as CSSProperties}>
          <p className="micro micro--row">
            <b>Latest project</b>
            <span>{no(1)}</span>
            {project.publishedAt ? <time dateTime={isoDate(project.publishedAt)}>{dotDate(project.publishedAt)}</time> : null}
          </p>
          <h2 id="latest-title" className="latest__title">
            <Link href={href}>{project.title}</Link>
          </h2>
          <p className="latest__tagline">{project.tagline}</p>
          <ul className="chips">
            <li className="chip chip--accent">{CATEGORY_LABEL[project.category] ?? project.category}</li>
            {project.startedOn || project.publishedAt ? <li className="chip">{yearOf(project.startedOn ?? project.publishedAt)}</li> : null}
            <li>
              <StatusChip lifecycle={project.lifecycle} />
            </li>
          </ul>
          <Link className="more" href={href} aria-label={`More about ${project.title}`}>
            for more information »
          </Link>
        </div>

        {live ? (
          <RotatingBadge
            id="latest-visit"
            text="VISIT ✿ VISIT ✿ VISIT ✿ VISIT ✿ "
            href={live.url}
            label={`Visit ${project.title} (opens in a new tab)`}
            className="latest__badge badge--accent arrive--stick"
            size={124}
          />
        ) : null}
      </div>
    </section>
  );
}
