import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { StateBox } from "@/components/admin/StateBox";
import { cldImage } from "@/lib/cloudinary";
import { dateTime } from "@/lib/admin-format";
import { createProject } from "@/server/admin/projects";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Project History" };

const STATUS_LABEL: Record<string, string> = { published: "Published", draft: "Draft", archived: "Archived" };

export default async function ProjectsPage() {
  await requireAdmin();
  const ma = schema.mediaAssets;
  const [rows, images] = await Promise.all([
    db
      .select({ id: schema.projects.id, title: schema.projects.title, slug: schema.projects.slug, status: schema.projects.status, publishedAt: schema.projects.publishedAt, updatedAt: schema.projects.updatedAt })
      .from(schema.projects)
      .orderBy(desc(schema.projects.publishedAt), desc(schema.projects.updatedAt)),
    db
      .select({ projectId: ma.projectId, role: ma.role, publicId: ma.publicId })
      .from(ma)
      .where(and(eq(ma.kind, "image"), inArray(ma.role, ["cover", "gallery"])))
      .orderBy(asc(ma.sortOrder), asc(ma.id)),
  ]);
  // Same rule as the public cards: the "cover" image, else the first gallery image.
  const cover = (id: number) => (images.find((m) => m.projectId === id && m.role === "cover") ?? images.find((m) => m.projectId === id))?.publicId;

  return (
    <>
      <AdminPageHead href="/admin/projects" />
      <Paper elevation={0} className="apanel apanel--form">
        <form action={createProject} className="admin-search admin-search--flush">
          <TextField name="title" size="small" label="New project title" required slotProps={{ htmlInput: { maxLength: 80 } }} sx={{ flex: 1 }} />
          <Button type="submit" variant="contained">
            New project
          </Button>
        </form>
        <p className="ed-hint">It starts as a draft. Fill it in, then press “Save & publish” — the newest published project becomes “Latest”.</p>
      </Paper>
      {rows.length ? (
        <ul className="plist">
          {rows.map((r) => {
            const img = cover(r.id);
            return (
              <li key={r.id}>
                <Link href={`/admin/projects/${r.id}`} className="plist__row" data-status={r.status}>
                  <span className="plist__thumb" style={img ? { backgroundImage: `url(${cldImage(img, { w: 320 })})` } : undefined} aria-hidden="true">
                    {img ? null : <FolderKanban size={22} />}
                  </span>
                  <span className="plist__main">
                    <strong>{r.title}</strong>
                    <span className="plist__slug">/history/{r.slug}</span>
                  </span>
                  <span className={`apill apill--${r.status}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                  <span className="plist__dates">
                    <span>
                      <span className="plist__k">Published</span> {dateTime(r.publishedAt)}
                    </span>
                    <span>
                      <span className="plist__k">Last saved</span> {dateTime(r.updatedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <StateBox icon={FolderKanban}>No projects yet. Add the first one above.</StateBox>
      )}
    </>
  );
}
