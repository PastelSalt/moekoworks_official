"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

// Messages inbox actions (plan §13.3). Every action requires a full (unrestricted) admin session.
const STATUSES = ["unread", "read", "archived", "spam", "trash"] as const;
type Status = (typeof STATUSES)[number];

const ids = (formData: FormData) =>
  formData
    .getAll("ids")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 200);

function patchFor(status: Status) {
  const now = new Date();
  return {
    status,
    ...(status === "read" ? { readAt: now } : {}),
    ...(status === "unread" ? { readAt: null } : {}),
    trashedAt: status === "trash" ? now : null,
  };
}

/** Bulk actions from the list: op = read | unread | archive | spam | trash | restore. */
export async function bulkMessages(formData: FormData) {
  const session = await requireAdmin();
  const list = ids(formData);
  const op = String(formData.get("op") ?? "");
  const back = String(formData.get("back") ?? "/admin/messages");
  const map: Record<string, Status> = { read: "read", unread: "unread", archive: "archived", spam: "spam", trash: "trash", restore: "read" };
  const status = map[op];
  if (list.length && status) {
    await db.update(schema.contactMessages).set(patchFor(status)).where(inArray(schema.contactMessages.id, list));
    await logActivity(session.user.id, `message.${op}`, `${list.length} message${list.length === 1 ? "" : "s"}`, { entityType: "contact_message" });
    revalidatePath("/admin", "layout");
  }
  redirect(back.startsWith("/admin/messages") ? back : "/admin/messages");
}

export async function setMessageStatus(id: number, status: Status) {
  const session = await requireAdmin();
  if (!STATUSES.includes(status)) return;
  await db.update(schema.contactMessages).set(patchFor(status)).where(eq(schema.contactMessages.id, id));
  await logActivity(session.user.id, `message.${status}`, undefined, { entityType: "contact_message", entityId: id });
  revalidatePath("/admin", "layout");
}

export async function toggleStar(id: number, starred: boolean) {
  await requireAdmin();
  await db.update(schema.contactMessages).set({ starred }).where(eq(schema.contactMessages.id, id));
  revalidatePath("/admin/messages");
}

export async function markReplied(id: number) {
  await requireAdmin();
  await db.update(schema.contactMessages).set({ repliedAt: new Date() }).where(eq(schema.contactMessages.id, id));
  revalidatePath(`/admin/messages/${id}`);
}

/** Permanent delete, only for messages already in Trash (the UI asks for confirmation first). */
export async function deleteMessageForever(id: number) {
  const session = await requireAdmin();
  const deleted = await db
    .delete(schema.contactMessages)
    .where(and(eq(schema.contactMessages.id, id), eq(schema.contactMessages.status, "trash")))
    .returning({ id: schema.contactMessages.id });
  if (deleted.length) await logActivity(session.user.id, "message.delete", "Deleted permanently from Trash", { entityType: "contact_message", entityId: id });
  revalidatePath("/admin", "layout");
  redirect("/admin/messages?folder=trash");
}
