"use server";

import { and, eq, max, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isHex, onAccentOf, strongOf } from "@/lib/color";
import { logActivity, requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";
import { destroyAsset } from "./cloudinary";

// Project History (plan §11). Everything is validated here; the editor only sends JSON.
const CATEGORIES = ["web", "mobile", "desktop", "game", "tool", "research", "concept", "other"] as const;
const LIFECYCLES = ["live", "beta", "in_development", "completed", "delivered", "research", "concept", "archived"] as const;
const PLATFORMS = ["web", "android", "ios", "windows", "macos", "linux"] as const;
const LINK_KINDS = ["live", "apk", "exe", "msi", "dmg", "appimage", "ios", "play_store", "app_store", "docs", "demo_video", "paper", "other"] as const;
const FRAMES = ["auto", "browser", "phone", "tablet", "window", "none"] as const;
const MEDIA_ROLES = ["gallery", "cover", "preview", "hover", "og"] as const;
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const opt = (n: number) => z.string().trim().max(n).transform((v) => v || null).nullable();
const https = z.string().trim().url().regex(/^https:\/\//, "Links must start with https://");

const ProjectInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(80),
  slug: z.string().trim().max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes"),
  tagline: z.string().trim().min(10, "One-sentence description: 10–160 characters").max(160, "One-sentence description: 10–160 characters"),
  descriptionMd: z.string().max(40_000),
  category: z.enum(CATEGORIES),
  platforms: z.array(z.enum(PLATFORMS)).max(6),
  lifecycle: z.enum(LIFECYCLES),
  role: opt(160),
  startedOn: day,
  finishedOn: day,
  accentColor: z.string().nullable().refine((v) => v === null || isHex(v), "Accent: #RRGGBB"),
  accentColor2: z.string().nullable().refine((v) => v === null || isHex(v), "Second accent: #RRGGBB"),
  seoTitle: opt(70),
  seoDescription: opt(200),
  disclaimerMd: opt(2000),
  credits: z.array(z.object({ name: z.string().trim().min(1).max(80), role: z.string().trim().max(80).optional(), url: https.optional() })).max(20),
  links: z.array(z.object({ kind: z.enum(LINK_KINDS), label: opt(60), url: https, note: opt(80), isPrimary: z.boolean() })).max(12),
  tech: z.array(z.object({ technologyId: z.number().int().positive(), usageNote: opt(160) })).max(40),
  operations: z
    .array(z.object({ audience: z.enum(["visitor", "admin", "system"]), title: z.string().trim().min(1, "Operation title is required").max(80), bodyMd: z.string().max(4000), icon: opt(40), mediaId: z.number().int().positive().nullable() }))
    .max(60),
  media: z.array(z.object({ id: z.number().int().positive(), role: z.enum(MEDIA_ROLES), frame: z.enum(FRAMES), altText: opt(300), caption: opt(200) })).max(80),
});
export type ProjectInputT = z.input<typeof ProjectInput>;
export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

// every page, plus the sitemap, so a newly published project is listed for search engines right away
const refresh = () => {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
};

function slugify(title: string) {
  return (
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "project"
  );
}

export async function createProject(formData: FormData) {
  const session = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80) || "Untitled project";
  const base = slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const [taken] = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.slug, slug)).limit(1);
    if (!taken) break;
    slug = `${base.slice(0, 56)}-${i}`;
  }
  const [row] = await db
    .insert(schema.projects)
    .values({ title, slug, tagline: "One sentence about this project (10–160 characters).", category: "web", platforms: ["web"], lifecycle: "in_development", status: "draft" })
    .returning({ id: schema.projects.id });
  await logActivity(session.user.id, "project.create", title, { entityType: "project", entityId: row.id });
  redirect(`/admin/projects/${row.id}`);
}

export async function saveProject(id: number, input: ProjectInputT): Promise<SaveResult> {
  const session = await requireAdmin();
  const parsed = ProjectInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const p = parsed.data;
  const [current] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  if (!current) return { ok: false, error: "Project not found." };
  if (p.slug !== current.slug) {
    const [taken] = await db.select({ id: schema.projects.id }).from(schema.projects).where(and(eq(schema.projects.slug, p.slug), ne(schema.projects.id, id))).limit(1);
    if (taken) return { ok: false, error: "That slug is already used by another project." };
  }
  if (p.links.filter((l) => l.isPrimary).length > 1) return { ok: false, error: "Only one link can be the primary one." };
  const own = await db.select({ id: schema.mediaAssets.id }).from(schema.mediaAssets).where(eq(schema.mediaAssets.projectId, id));
  const ownIds = new Set(own.map((m) => m.id));
  if (p.media.some((m) => !ownIds.has(m.id)) || p.operations.some((o) => o.mediaId && !ownIds.has(o.mediaId))) return { ok: false, error: "Some media no longer exists. Reload the page." };

  const accent = p.accentColor;
  const statements = [
    db
      .update(schema.projects)
      .set({
        title: p.title,
        slug: p.slug,
        tagline: p.tagline,
        descriptionMd: p.descriptionMd,
        category: p.category,
        platforms: p.platforms,
        lifecycle: p.lifecycle,
        role: p.role,
        startedOn: p.startedOn,
        finishedOn: p.finishedOn,
        accentColor: accent,
        accentColor2: p.accentColor2,
        accentStrong: accent ? strongOf(accent) : null,
        accentOn: accent ? onAccentOf(accent) : null,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        disclaimerMd: p.disclaimerMd,
        credits: p.credits,
        updatedAt: sql`now()`,
      })
      .where(eq(schema.projects.id, id)),
    db.delete(schema.projectLinks).where(eq(schema.projectLinks.projectId, id)),
    db.delete(schema.projectTechnologies).where(eq(schema.projectTechnologies.projectId, id)),
    db.delete(schema.projectOperations).where(eq(schema.projectOperations.projectId, id)),
    ...(p.links.length ? [db.insert(schema.projectLinks).values(p.links.map((l, i) => ({ ...l, projectId: id, sortOrder: i })))] : []),
    ...(p.tech.length ? [db.insert(schema.projectTechnologies).values(p.tech.map((t, i) => ({ ...t, projectId: id, sortOrder: i })))] : []),
    ...(p.operations.length ? [db.insert(schema.projectOperations).values(p.operations.map((o, i) => ({ ...o, projectId: id, sortOrder: i })))] : []),
    ...p.media.map((m, i) => db.update(schema.mediaAssets).set({ role: m.role, frame: m.frame, altText: m.altText, caption: m.caption, sortOrder: i }).where(eq(schema.mediaAssets.id, m.id))),
    // a changed slug of a published project keeps working through a 301 (plan §5.4)
    ...(p.slug !== current.slug && current.publishedAt
      ? [db.insert(schema.projectSlugHistory).values({ oldSlug: current.slug, projectId: id }).onConflictDoUpdate({ target: schema.projectSlugHistory.oldSlug, set: { projectId: id, changedAt: sql`now()` } })]
      : []),
  ];
  await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);
  await logActivity(session.user.id, "project.save", p.title, { entityType: "project", entityId: id });
  refresh();
  return { ok: true, slug: p.slug };
}

export async function setProjectStatus(id: number, status: "draft" | "published" | "archived"): Promise<SaveResult> {
  const session = await requireAdmin();
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  if (!project) return { ok: false, error: "Project not found." };
  if (status === "published") {
    const media = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.projectId, id));
    const missingAlt = media.filter((m) => m.kind === "image" && !m.altText?.trim());
    if (missingAlt.length) return { ok: false, error: `Add alt text to every image before publishing (${missingAlt.length} missing).` };
    if (project.tagline.startsWith("One sentence about this project")) return { ok: false, error: "Write the one-sentence description before publishing." };
  }
  await db
    .update(schema.projects)
    .set({ status, ...(status === "published" && !project.publishedAt ? { publishedAt: new Date() } : {}), updatedAt: sql`now()` })
    .where(eq(schema.projects.id, id));
  await logActivity(session.user.id, `project.${status === "published" ? "publish" : status === "archived" ? "archive" : "unpublish"}`, project.title, { entityType: "project", entityId: id });
  refresh();
  return { ok: true, slug: project.slug };
}

export type UploadResult = { public_id: string; version: number; format: string; width?: number; height?: number; bytes?: number; duration?: number; resource_type: string; colors?: [string, number][] };

/** Registers an asset that the browser just uploaded to Cloudinary. */
export async function addMedia(projectId: number | null, upload: UploadResult, role: string) {
  const session = await requireAdmin();
  const kind = upload.resource_type === "video" ? "video" : "image";
  const root = process.env.CLOUDINARY_ROOT_FOLDER ?? "moekoworks-official";
  if (!upload.public_id || !upload.public_id.startsWith(`${root}/`) && !/^[a-z0-9]{12,}$/i.test(upload.public_id)) return null;
  const allowed = projectId ? MEDIA_ROLES : (["certificate", "site"] as const);
  const safeRole = (allowed as readonly string[]).includes(role) ? role : projectId ? "gallery" : "certificate";
  const [{ next }] = await db.select({ next: max(schema.mediaAssets.sortOrder) }).from(schema.mediaAssets).where(projectId ? eq(schema.mediaAssets.projectId, projectId) : sql`false`);
  const [row] = await db
    .insert(schema.mediaAssets)
    .values({
      projectId,
      kind,
      role: safeRole,
      publicId: upload.public_id,
      version: upload.version,
      format: upload.format,
      width: upload.width ?? null,
      height: upload.height ?? null,
      bytes: upload.bytes ?? null,
      durationMs: upload.duration ? Math.round(upload.duration * 1000) : null,
      frame: "auto",
      dominantColor: upload.colors?.[0]?.[0]?.slice(0, 9) ?? null,
      sortOrder: (next ?? -1) + 1,
    })
    .returning();
  await logActivity(session.user.id, "media.upload", upload.public_id, { entityType: "media", entityId: row.id });
  return row;
}

export async function removeMedia(mediaId: number) {
  const session = await requireAdmin();
  const [row] = await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, mediaId)).returning();
  if (!row) return false;
  await destroyAsset(row.publicId, row.kind === "video" ? "video" : "image");
  await logActivity(session.user.id, "media.delete", row.publicId, { entityType: "media", entityId: mediaId });
  refresh();
  return true;
}
