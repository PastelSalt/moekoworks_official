import { count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const [{ value: unread }] = await db
    .select({ value: count() })
    .from(schema.contactMessages)
    .where(eq(schema.contactMessages.status, "unread"));
  return <AdminShell unread={unread}>{children}</AdminShell>;
}
