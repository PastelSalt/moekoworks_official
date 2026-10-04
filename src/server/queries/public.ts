import "server-only";

import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/server/db";

export type Media = {
  id: number;
  kind: string;
  role: string;
  publicId: string;
  width: number | null;
  height: number | null;
  frame: string;
  altText: string | null;
  caption: string | null;
  dominantColor: string | null;
  durationMs: number | null;
};
export type Tech = { id: number; slug: string; name: string; category: string; iconKey: string | null; color: string | null; usageNote?: string | null };
export type Link = { kind: string; label: string | null; url: string; note: string | null; isPrimary: boolean };
export type Operation = { id: number; audience: string; title: string; bodyMd: string; icon: string | null; media: Media | null };

export type ProjectSummary = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  platforms: string[];
  lifecycle: string;
  role: string | null;
  startedOn: string | null;
  finishedOn: string | null;
  publishedAt: Date | null;
  accentColor: string | null;
  accentColor2: string | null;
  accentStrong: string | null;
  accentOn: string | null;
  cover: Media | null;
  preview: Media | null;
  /** Optional short ~480p loop for hover previews; otherwise the first 8 s of the preview are used. */
  hover: Media | null;
  tech: Tech[];
  links: Link[];
};
export type ProjectDetail = ProjectSummary & {
  descriptionMd: string;
  credits: { name: string; role?: string; url?: string }[];
  disclaimerMd: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gallery: Media[];
  operations: Operation[];
};

const mediaCols = {
  id: schema.mediaAssets.id,
  projectId: schema.mediaAssets.projectId,
  kind: schema.mediaAssets.kind,
  role: schema.mediaAssets.role,
  publicId: schema.mediaAssets.publicId,
  width: schema.mediaAssets.width,
  height: schema.mediaAssets.height,
  frame: schema.mediaAssets.frame,
  altText: schema.mediaAssets.altText,
  caption: schema.mediaAssets.caption,
  dominantColor: schema.mediaAssets.dominantColor,
  durationMs: schema.mediaAssets.durationMs,
  sortOrder: schema.mediaAssets.sortOrder,
};

async function loadSummaries(rows: (typeof schema.projects.$inferSelect)[]): Promise<ProjectSummary[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [media, tech, links] = await Promise.all([
    db.select(mediaCols).from(schema.mediaAssets).where(inArray(schema.mediaAssets.projectId, ids)).orderBy(asc(schema.mediaAssets.sortOrder)),
    db
      .select({
        projectId: schema.projectTechnologies.projectId,
        id: schema.technologies.id,
        slug: schema.technologies.slug,
        name: schema.technologies.name,
        category: schema.technologies.category,
        iconKey: schema.technologies.iconKey,
        color: schema.technologies.color,
        usageNote: schema.projectTechnologies.usageNote,
      })
      .from(schema.projectTechnologies)
      .innerJoin(schema.technologies, eq(schema.technologies.id, schema.projectTechnologies.technologyId))
      .where(inArray(schema.projectTechnologies.projectId, ids))
      .orderBy(asc(schema.projectTechnologies.sortOrder)),
    db.select().from(schema.projectLinks).where(inArray(schema.projectLinks.projectId, ids)).orderBy(asc(schema.projectLinks.sortOrder)),
  ]);
  return rows.map((p) => {
    const own = media.filter((m) => m.projectId === p.id);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      category: p.category,
      platforms: p.platforms,
      lifecycle: p.lifecycle,
      role: p.role,
      startedOn: p.startedOn,
      finishedOn: p.finishedOn,
      publishedAt: p.publishedAt,
      accentColor: p.accentColor,
      accentColor2: p.accentColor2,
      accentStrong: p.accentStrong,
      accentOn: p.accentOn,
      cover: own.find((m) => m.role === "cover") ?? own.find((m) => m.role === "gallery" && m.kind === "image") ?? null,
      preview: own.find((m) => m.role === "preview" && m.kind === "video") ?? null,
      hover: own.find((m) => m.role === "hover" && m.kind === "video") ?? null,
      tech: tech.filter((t) => t.projectId === p.id),
      links: links.filter((l) => l.projectId === p.id),
    };
  });
}

/** Newest published first: the first item is the "Latest project". */
export const getPublishedProjects = cache(async (): Promise<ProjectSummary[]> => {
  const rows = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.status, "published"), isNotNull(schema.projects.publishedAt)))
    .orderBy(desc(schema.projects.publishedAt));
  return loadSummaries(rows);
});

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectDetail | null> => {
  const [row] = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.slug, slug), eq(schema.projects.status, "published")))
    .limit(1);
  if (!row) return null;
  const [summary] = await loadSummaries([row]);
  const [gallery, ops] = await Promise.all([
    db
      .select(mediaCols)
      .from(schema.mediaAssets)
      .where(and(eq(schema.mediaAssets.projectId, row.id), eq(schema.mediaAssets.role, "gallery")))
      .orderBy(asc(schema.mediaAssets.sortOrder)),
    db.select().from(schema.projectOperations).where(eq(schema.projectOperations.projectId, row.id)).orderBy(asc(schema.projectOperations.sortOrder)),
  ]);
  const opMediaIds = ops.map((o) => o.mediaId).filter((x): x is number => x !== null);
  const opMedia = opMediaIds.length ? await db.select(mediaCols).from(schema.mediaAssets).where(inArray(schema.mediaAssets.id, opMediaIds)) : [];
  return {
    ...summary,
    descriptionMd: row.descriptionMd,
    credits: (row.credits as ProjectDetail["credits"]) ?? [],
    disclaimerMd: row.disclaimerMd,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    gallery,
    operations: ops.map((o) => ({
      id: o.id,
      audience: o.audience,
      title: o.title,
      bodyMd: o.bodyMd,
      icon: o.icon,
      media: opMedia.find((m) => m.id === o.mediaId) ?? null,
    })),
  };
});

export type Certification = { id: number; title: string; obtainedOn: string; media: Media };

export async function getPublishedCertifications(): Promise<Certification[]> {
  const rows = await db
    .select({ id: schema.certifications.id, title: schema.certifications.title, obtainedOn: schema.certifications.obtainedOn, media: mediaCols })
    .from(schema.certifications)
    .innerJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.certifications.mediaId))
    .where(eq(schema.certifications.status, "published"))
    .orderBy(desc(schema.certifications.obtainedOn));
  return rows;
}

export type Update = { date: Date; kind: "project" | "certification"; text: string; href: string };

/** NEWS is generated from what you publish: no separate admin module (DEC-31). */
export function buildUpdates(projects: ProjectSummary[], certs: Certification[], limit = 8): Update[] {
  const items: Update[] = [
    ...projects.filter((p) => p.publishedAt).map((p) => ({ date: p.publishedAt as Date, kind: "project" as const, text: `New project: ${p.title}`, href: `/history/${p.slug}` })),
    ...certs.map((c) => ({ date: new Date(`${c.obtainedOn}T00:00:00+08:00`), kind: "certification" as const, text: `Certification: ${c.title}`, href: "/about#certifications" })),
  ];
  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}

export type ToolboxItem = Tech & { projects: number };

export function buildToolbox(projects: ProjectSummary[]): ToolboxItem[] {
  const map = new Map<number, ToolboxItem>();
  for (const p of projects) for (const t of p.tech) map.set(t.id, { ...t, projects: (map.get(t.id)?.projects ?? 0) + 1 });
  return [...map.values()].sort((a, b) => b.projects - a.projects || a.name.localeCompare(b.name));
}

export type CatalogTech = Tech & { url: string | null; projects: number };

/** The About toolbox: every technology in the catalog, with how many published projects use it. */
export async function getToolbox(): Promise<CatalogTech[]> {
  const [all, used] = await Promise.all([
    db.select().from(schema.technologies).orderBy(asc(schema.technologies.name)),
    db
      .select({ technologyId: schema.projectTechnologies.technologyId, projectId: schema.projectTechnologies.projectId })
      .from(schema.projectTechnologies)
      .innerJoin(schema.projects, eq(schema.projects.id, schema.projectTechnologies.projectId))
      .where(eq(schema.projects.status, "published")),
  ]);
  return all.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    category: t.category,
    iconKey: t.iconKey,
    color: t.color,
    url: t.url,
    projects: used.filter((u) => u.technologyId === t.id).length,
  }));
}
