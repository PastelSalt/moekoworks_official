import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { type ArchiveSource, ArchiveView } from "@/components/admin/views/ArchiveView";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Archive" };

export default async function ArchivePage({ searchParams }: PageProps<"/admin/archive">) {
  await requireAdmin();
  const sp = await searchParams;
  const source: ArchiveSource = sp.from === "projects" || sp.from === "certifications" ? sp.from : "all";
  const pr = schema.projects;
  const ce = schema.certifications;
  const ma = schema.mediaAssets;
  const [projects, certs] = await Promise.all([
    db.select({ id: pr.id, title: pr.title, slug: pr.slug, updatedAt: pr.updatedAt }).from(pr).where(eq(pr.status, "archived")).orderBy(desc(pr.updatedAt)),
    db
      .select({ id: ce.id, title: ce.title, obtainedOn: ce.obtainedOn, mediaId: ce.mediaId, publicId: ma.publicId, updatedAt: ce.updatedAt })
      .from(ce)
      .innerJoin(ma, eq(ma.id, ce.mediaId))
      .where(eq(ce.status, "archived"))
      .orderBy(desc(ce.updatedAt)),
  ]);
  const covers = projects.length
    ? await db
        .select({ projectId: ma.projectId, role: ma.role, publicId: ma.publicId })
        .from(ma)
        .where(and(eq(ma.kind, "image"), inArray(ma.role, ["cover", "gallery"]), inArray(ma.projectId, projects.map((p) => p.id))))
        .orderBy(asc(ma.sortOrder), asc(ma.id))
    : [];
  const cover = (id: number) => (covers.find((m) => m.projectId === id && m.role === "cover") ?? covers.find((m) => m.projectId === id))?.publicId ?? null;
  return <ArchiveView projects={projects.map((p) => ({ ...p, cover: cover(p.id) }))} certs={certs} source={source} />;
}
