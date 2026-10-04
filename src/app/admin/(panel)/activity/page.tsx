import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { dateTime } from "@/lib/admin-format";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Activity" };

/** Security & activity log (plan §10.7): sign-ins, password changes, publishes, uploads, inbox actions. */
export default async function ActivityPage() {
  await requireAdmin();
  const rows = await db
    .select({ at: schema.activityLog.occurredAt, action: schema.activityLog.action, summary: schema.activityLog.summary, user: schema.adminUsers.username })
    .from(schema.activityLog)
    .leftJoin(schema.adminUsers, eq(schema.adminUsers.id, schema.activityLog.adminUserId))
    .orderBy(desc(schema.activityLog.occurredAt))
    .limit(200);
  return (
    <>
      <p className="admin-label">No.07 — Activity</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Activity
      </Typography>
      <Paper elevation={0} sx={{ boxShadow: "var(--shadow-paper)", overflow: "hidden" }}>
        <table className="stable">
          <thead>
            <tr>
              <th>When (PH time)</th>
              <th>What</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{dateTime(r.at)}</td>
                <td>
                  <code>{r.action}</code>
                </td>
                <td>{r.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="scard__empty" style={{ padding: 16 }}>Nothing yet.</p> : null}
      </Paper>
      <p className="admin-hint">The latest 200 entries.</p>
    </>
  );
}
