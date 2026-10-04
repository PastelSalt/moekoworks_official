import Link from "next/link";
import { Flower, Sticker } from "@/components/decor/Decor";
import { cldVideo } from "@/lib/cloudinary";
import { accentVars } from "@/lib/color";
import { CATEGORY_LABEL, dotDate, isoDate, no } from "@/lib/format";
import type { ProjectSummary } from "@/server/queries/public";
import { CldImg, StatusChip, TechIcons } from "./bits";
import { PreviewVideo } from "./PreviewVideo";

/** WORKS card: cover, hover video, No. badge, title, one-liner, tech icons, date. The whole card is one link. */
export function ProjectCard({ project, index, featured = false, latest = false }: { project: ProjectSummary; index: number; featured?: boolean; latest?: boolean }) {
  const href = `/history/${project.slug}`;
  return (
    <article className={`pcard ${featured ? "pcard--featured" : ""} reveal`} data-hover-host style={accentVars(project)}>
      <div className="pcard__media">
        {project.cover ? <CldImg media={project.cover} sizes={featured ? "(min-width: 900px) 60vw, 100vw" : "(min-width: 900px) 30vw, 100vw"} className="pcard__img" /> : <div className="pcard__art" aria-hidden="true" />}
        {project.preview ? (
          <PreviewVideo mode="hover" className="pcard__video" src={cldVideo.hover(project.preview.publicId)} poster={project.cover ? undefined : cldVideo.poster(project.preview.publicId)} />
        ) : null}
        <span className="pcard__no" aria-hidden="true">
          {no(index)}
        </span>
        {latest ? (
          <Sticker tone="butter" tilt={8} className="pcard__latest">
            Latest
          </Sticker>
        ) : null}
        {project.preview ? (
          <span className="pcard__hint" aria-hidden="true">
            <Flower tone="white" size={12} /> Hover to preview
          </span>
        ) : null}
      </div>
      <div className="pcard__body">
        <p className="micro micro--row">
          <span>{CATEGORY_LABEL[project.category] ?? project.category}</span>
          {project.publishedAt ? <time dateTime={isoDate(project.publishedAt)}>{dotDate(project.publishedAt)}</time> : null}
        </p>
        <h3 className="pcard__title">
          <Link href={href}>{project.title}</Link>
        </h3>
        <p className="pcard__tagline">{project.tagline}</p>
        <div className="pcard__foot">
          <TechIcons tech={project.tech} max={featured ? 8 : 5} />
          <StatusChip lifecycle={project.lifecycle} />
        </div>
      </div>
    </article>
  );
}

/** Fills the grid while there are few projects (plan §8.1 zone 5). */
export function ComingSoonCard() {
  return (
    <div className="pcard pcard--soon reveal-pop" aria-label="More projects on the way">
      <div className="pcard__soon">
        <Flower tone="pink" size={56} outline className="float" />
        <p className="pcard__soon-text">More projects on the way ✿</p>
        <p className="micro">Stay tuned</p>
      </div>
    </div>
  );
}
