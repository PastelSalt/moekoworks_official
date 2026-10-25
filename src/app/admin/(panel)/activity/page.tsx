import Paper from "@mui/material/Paper";
import { desc } from "drizzle-orm";
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
  const rows = await db
    .select({ at: schema.activityLog.occurredAt, action: schema.activityLog.action, summary: schema.activityLog.summary })
    .from(schema.activityLog)
    .orderBy(desc(schema.activityLog.occurredAt))
    .limit(200);
  return (
    <>
      <AdminPageHead href="/admin/activity" hint="Sign-ins, password changes, publishes, uploads and inbox actions. Times are PH time." />
      <Paper elevation={0} className="apanel">{rows.length ? <ActivityList rows={rows} /> : <StateBox>Nothing yet.</StateBox>}</Paper>
      <p className="admin-hint">The latest 200 entries.</p>
    </>
  );
}
