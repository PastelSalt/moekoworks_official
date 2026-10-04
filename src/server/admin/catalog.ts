"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isHex } from "@/lib/color";
import { logActivity, requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

// Certifications (image + title + date obtained, plan §11.6) and the tech catalog.
export type Result = { ok: true; id: number } | { ok: false; error: string };
const refresh = () => revalidatePath("/", "layout");

const Cert = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Title is required").max(120, "Title: 120 characters max"),
  obtainedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the date you got it"),
  mediaId: z.number({ error: "Upload the certificate image first" }).int().positive(),
  altText: z.string().trim().max(300).optional(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function saveCertification(input: z.input<typeof Cert>): Promise<Result> {
  const session = await requireAdmin();
  const parsed = Cert.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const c = parsed.data;
  if (c.altText !== undefined) await db.update(schema.mediaAssets).set({ altText: c.altText || `Certificate: ${c.title}`, role: "certificate" }).where(eq(schema.mediaAssets.id, c.mediaId));
  let id = c.id;
  if (id) {
    await db.update(schema.certifications).set({ title: c.title, obtainedOn: c.obtainedOn, mediaId: c.mediaId, status: c.status, updatedAt: sql`now()` }).where(eq(schema.certifications.id, id));
  } else {
    [{ id }] = await db.insert(schema.certifications).values({ title: c.title, obtainedOn: c.obtainedOn, mediaId: c.mediaId, status: c.status }).returning({ id: schema.certifications.id });
  }
  await logActivity(session.user.id, c.id ? "certification.save" : "certification.create", c.title, { entityType: "certification", entityId: id });
  refresh();
  return { ok: true, id: id! };
}

const Tech = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().trim().max(40).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes"),
  name: z.string().trim().min(1, "Name is required").max(40),
  category: z.enum(["language", "framework", "library", "runtime", "database", "cloud", "service", "tool", "design", "platform", "other"]),
  iconKey: z.string().trim().max(40).nullable(),
  color: z.string().nullable().refine((v) => v === null || isHex(v), "Colour: #RRGGBB"),
  url: z.string().trim().url().regex(/^https:\/\//).nullable().or(z.literal("").transform(() => null)),
});

export async function saveTech(input: z.input<typeof Tech>): Promise<Result> {
  const session = await requireAdmin();
  const parsed = Tech.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const t = parsed.data;
  try {
    let id = t.id;
    const values = { slug: t.slug, name: t.name, category: t.category, iconKey: t.iconKey || null, color: t.color, url: t.url };
    if (id) await db.update(schema.technologies).set(values).where(eq(schema.technologies.id, id));
    else [{ id }] = await db.insert(schema.technologies).values(values).returning({ id: schema.technologies.id });
    await logActivity(session.user.id, t.id ? "tech.save" : "tech.create", t.name, { entityType: "technology", entityId: id });
    refresh();
    return { ok: true, id: id! };
  } catch {
    return { ok: false, error: "That slug is already in the catalog." };
  }
}
