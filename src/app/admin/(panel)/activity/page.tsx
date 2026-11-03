import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ActivityList } from "@/components/admin/ActivityList";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { StateBox } from "@/components/admin/StateBox";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Activity" };

/** Security & activity log (plan §10.7): sign-ins, password changes, publishes, uploads, inbox actions. */
export default async function ActivityPage() {
  await requireAdmin();
  const a = schema.activityLog;
  const rows = await db
    .select({ at: a.occurredAt, action: a.action, summary: a.summary, user: schema.adminUsers.username })
    .from(a)
    .leftJoin(schema.adminUsers, eq(schema.adminUsers.id, a.adminUserId))
    .orderBy(desc(a.occurredAt))
    .limit(200);
  return (
    <>
      <AdminPageHead href="/admin/activity" hint="Who changed what, and when. Sign-ins, publishes, uploads and inbox actions; the latest 200 entries." />
      {rows.length ? <ActivityList rows={rows} /> : <StateBox>Nothing yet.</StateBox>}
    </>
  );
}
