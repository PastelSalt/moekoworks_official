import { Award, FolderKanban, Mail } from "lucide-react";
import Link from "next/link";
import { cldImage } from "@/lib/cloudinary";
import { dateTime } from "@/lib/admin-format";
import { AdminItem } from "../AdminItem";
import { AdminPageHead } from "../AdminPageHead";
import { ArchiveRestoreButton } from "../ArchiveRestore";
import { SegmentedLinks } from "../Segmented";
import { StateBox } from "../StateBox";

export type ArchivedProject = { id: number; title: string; slug: string; updatedAt: Date; cover: string | null };
export type ArchivedCert = { id: number; title: string; obtainedOn: string; mediaId: number; publicId: string; updatedAt: Date };
export type ArchiveSource = "all" | "projects" | "certifications";

/** Kotoha's Archive: everything taken off the site, newest first, with Restore. Built from the existing "archived" status. */
export function ArchiveView({ projects, certs, source }: { projects: ArchivedProject[]; certs: ArchivedCert[]; source: ArchiveSource }) {
  const rows = [
    ...(source === "certifications" ? [] : projects.map((p) => ({ kind: "project" as const, at: p.updatedAt, p }))),
    ...(source === "projects" ? [] : certs.map((c) => ({ kind: "certification" as const, at: c.updatedAt, c }))),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <>
      <AdminPageHead href="/admin/archive" hint="Everything taken off the site. Restore brings it back as a draft (projects) or hidden (certifications), so nothing goes live by accident." />
      <div className="atoolbar">
        <SegmentedLinks
          label="From"
          items={[
            { href: "/admin/archive", label: "All", count: projects.length + certs.length, active: source === "all" },
            { href: "/admin/archive?from=projects", label: "Projects", count: projects.length, active: source === "projects" },
            { href: "/admin/archive?from=certifications", label: "Certifications", count: certs.length, active: source === "certifications" },
          ]}
        />
        <Link href="/admin/messages?folder=archived" className="abtn abtn--ghost abtn--sm">
          <Mail aria-hidden /> Archived messages
        </Link>
      </div>
      {rows.length ? (
        <div className="items">
          {rows.map((r) =>
            r.kind === "project" ? (
              <AdminItem
                key={`p${r.p.id}`}
                thumb={r.p.cover ? cldImage(r.p.cover, { w: 320 }) : null}
                icon={FolderKanban}
                title={r.p.title}
                meta={
                  <>
                    <span className="apill apill--section">Project History</span>
                    <span>archived · last saved {dateTime(r.p.updatedAt)}</span>
                  </>
                }
                text={`/history/${r.p.slug}`}
                actions={<ArchiveRestoreButton item={{ kind: "project", id: r.p.id }} />}
              />
            ) : (
              <AdminItem
                key={`c${r.c.id}`}
                thumb={cldImage(r.c.publicId, { w: 360 })}
                thumbShape="card"
                icon={Award}
                title={r.c.title}
                meta={
                  <>
                    <span className="apill apill--section">Certifications</span>
                    <span>archived · last saved {dateTime(r.c.updatedAt)}</span>
                  </>
                }
                actions={<ArchiveRestoreButton item={{ kind: "certification", id: r.c.id, title: r.c.title, obtainedOn: r.c.obtainedOn, mediaId: r.c.mediaId }} />}
              />
            ),
          )}
        </div>
      ) : (
        <StateBox>The archive is empty.</StateBox>
      )}
    </>
  );
}
