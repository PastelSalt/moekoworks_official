import { FolderKanban } from "lucide-react";
import { cldImage } from "@/lib/cloudinary";
import { dateTime, relativeTime } from "@/lib/admin-format";
import { AdminItem } from "../AdminItem";
import { AdminPageHead } from "../AdminPageHead";
import { NewProjectButton } from "../NewProjectButton";
import { ProjectRowActions } from "../ProjectRowActions";
import { SegmentedLinks } from "../Segmented";
import { StateBox } from "../StateBox";

export type ProjectListRow = { id: number; title: string; slug: string; status: string; lifecycle: string; publishedAt: Date | null; updatedAt: Date; cover: string | null };
export type ProjectFilter = "all" | "published" | "draft" | "archived";

const STATUS = { published: "Published", draft: "Draft", archived: "Archived" } as Record<string, string>;
const LIFECYCLE: Record<string, string> = { live: "Live", beta: "Beta", in_development: "In development", completed: "Completed", delivered: "Delivered", research: "Research", concept: "Concept", archived: "Archived" };

export function ProjectsView({ rows, filter }: { rows: ProjectListRow[]; filter: ProjectFilter }) {
  const count = (s: ProjectFilter) => (s === "all" ? rows.filter((r) => r.status !== "archived").length : rows.filter((r) => r.status === s).length);
  const shown = rows.filter((r) => (filter === "all" ? r.status !== "archived" : r.status === filter));
  const filters: [ProjectFilter, string][] = [
    ["all", "All"],
    ["published", "Published"],
    ["draft", "Draft"],
    ["archived", "Archived"],
  ];
  return (
    <>
      <AdminPageHead href="/admin/projects" hint="Newest first. The newest published project is “Latest” on the home page." actions={<NewProjectButton />} />
      <div className="atoolbar">
        <SegmentedLinks label="Status" items={filters.map(([k, label]) => ({ href: k === "all" ? "/admin/projects" : `/admin/projects?status=${k}`, label, count: count(k), active: filter === k }))} />
      </div>
      {shown.length ? (
        <div className="items">
          {shown.map((r) => (
            <AdminItem
              key={r.id}
              thumb={r.cover ? cldImage(r.cover, { w: 320 }) : null}
              icon={FolderKanban}
              draft={r.status === "draft"}
              muted={r.status === "archived"}
              title={r.title}
              meta={
                <>
                  <span className="item__date">{r.status === "published" ? dateTime(r.publishedAt) : `saved ${relativeTime(r.updatedAt)}`}</span>
                  <span className={`apill apill--${r.status}`}>{STATUS[r.status] ?? r.status}</span>
                  <span>{LIFECYCLE[r.lifecycle] ?? r.lifecycle}</span>
                </>
              }
              text={`/history/${r.slug}`}
              actions={<ProjectRowActions id={r.id} title={r.title} slug={r.slug} status={r.status} />}
            />
          ))}
        </div>
      ) : (
        <StateBox>{filter === "all" ? "No projects yet. Press “New project” to add the first one." : `No ${filter} projects.`}</StateBox>
      )}
    </>
  );
}
