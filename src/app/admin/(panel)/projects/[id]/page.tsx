import Typography from "@mui/material/Typography";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type EditorData, ProjectEditor } from "@/components/admin/ProjectEditor";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [p] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  if (!p) notFound();
  const [media, links, tech, ops, catalog] = await Promise.all([
    db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.projectId, id)).orderBy(asc(schema.mediaAssets.sortOrder)),
    db.select().from(schema.projectLinks).where(eq(schema.projectLinks.projectId, id)).orderBy(asc(schema.projectLinks.sortOrder)),
    db.select().from(schema.projectTechnologies).where(eq(schema.projectTechnologies.projectId, id)).orderBy(asc(schema.projectTechnologies.sortOrder)),
    db.select().from(schema.projectOperations).where(eq(schema.projectOperations.projectId, id)).orderBy(asc(schema.projectOperations.sortOrder)),
    db.select({ id: schema.technologies.id, name: schema.technologies.name, category: schema.technologies.category }).from(schema.technologies).orderBy(asc(schema.technologies.category), asc(schema.technologies.name)),
  ]);

  const data: EditorData = {
    id,
    status: p.status,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    uploads: Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    catalog,
    media: media.map((m) => ({ id: m.id, kind: m.kind, role: m.role, frame: m.frame, altText: m.altText, caption: m.caption, publicId: m.publicId, width: m.width, height: m.height })),
    input: {
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      descriptionMd: p.descriptionMd,
      category: p.category as "web",
      platforms: p.platforms as "web"[],
      lifecycle: p.lifecycle as "live",
      role: p.role,
      startedOn: p.startedOn,
      finishedOn: p.finishedOn,
      accentColor: p.accentColor,
      accentColor2: p.accentColor2,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      disclaimerMd: p.disclaimerMd,
      credits: (p.credits as { name: string; role?: string; url?: string }[]) ?? [],
      links: links.map((l) => ({ kind: l.kind as "live", label: l.label, url: l.url, note: l.note, isPrimary: l.isPrimary })),
      tech: tech.map((t) => ({ technologyId: t.technologyId, usageNote: t.usageNote })),
      operations: ops.map((o) => ({ audience: o.audience as "visitor", title: o.title, bodyMd: o.bodyMd, icon: o.icon, mediaId: o.mediaId })),
      media: [],
    },
  };

  return (
    <>
      <Link className="admin-back" href="/admin/projects">
        ← Project History
      </Link>
      <Typography variant="h4" component="h1" sx={{ mt: 1, mb: 2 }}>
        {p.title}
      </Typography>
      <ProjectEditor data={data} />
    </>
  );
}
