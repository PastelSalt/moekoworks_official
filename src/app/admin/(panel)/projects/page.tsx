import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { type ProjectFilter, ProjectsView } from "@/components/admin/views/ProjectsView";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Project History" };

const FILTERS: ProjectFilter[] = ["all", "published", "draft", "archived"];

export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f === sp.status) ?? "all";
  const pr = schema.projects;
  const ma = schema.mediaAssets;
  const [rows, images] = await Promise.all([
    db
      .select({ id: pr.id, title: pr.title, slug: pr.slug, status: pr.status, lifecycle: pr.lifecycle, publishedAt: pr.publishedAt, updatedAt: pr.updatedAt })
      .from(pr)
      .orderBy(desc(pr.publishedAt), desc(pr.updatedAt)),
    db
      .select({ projectId: ma.projectId, role: ma.role, publicId: ma.publicId })
      .from(ma)
      .where(and(eq(ma.kind, "image"), inArray(ma.role, ["cover", "gallery"])))
      .orderBy(asc(ma.sortOrder), asc(ma.id)),
  ]);
  // Same rule as the public cards: the "cover" image, else the first gallery image.
  const cover = (id: number) => (images.find((m) => m.projectId === id && m.role === "cover") ?? images.find((m) => m.projectId === id))?.publicId ?? null;
  return <ProjectsView rows={rows.map((r) => ({ ...r, cover: cover(r.id) }))} filter={filter} />;
}
