import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { dateTime } from "@/lib/admin-format";
import { createProject } from "@/server/admin/projects";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Project History" };

export default async function ProjectsPage() {
  await requireAdmin();
  const rows = await db
    .select({ id: schema.projects.id, title: schema.projects.title, slug: schema.projects.slug, status: schema.projects.status, publishedAt: schema.projects.publishedAt, updatedAt: schema.projects.updatedAt })
    .from(schema.projects)
    .orderBy(desc(schema.projects.publishedAt), desc(schema.projects.updatedAt));

  return (
    <>
      <p className="admin-label">No.01 — Project History</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Project History
      </Typography>
      <Paper elevation={0} sx={{ p: 2, mb: 2, boxShadow: "var(--shadow-paper)" }}>
        <form action={createProject} className="admin-search" style={{ margin: 0 }}>
          <TextField name="title" size="small" label="New project title" required slotProps={{ htmlInput: { maxLength: 80 } }} sx={{ flex: 1 }} />
          <Button type="submit" variant="contained">
            New project
          </Button>
        </form>
        <p className="ed-hint" style={{ margin: "8px 2px 0" }}>
          It starts as a draft. Fill it in, then press “Save & publish” — the newest published project becomes “Latest”.
        </p>
      </Paper>
      <Paper elevation={0} sx={{ boxShadow: "var(--shadow-paper)", overflow: "hidden" }}>
        <table className="stable">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Published</th>
              <th>Last saved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/projects/${r.id}`}>
                    <strong>{r.title}</strong>
                  </Link>
                  <div className="ed-hint">/history/{r.slug}</div>
                </td>
                <td>
                  <Chip size="small" label={r.status} color={r.status === "published" ? "success" : "default"} />
                </td>
                <td>{dateTime(r.publishedAt)}</td>
                <td>{dateTime(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="scard__empty" style={{ padding: 16 }}>No projects yet.</p> : null}
      </Paper>
    </>
  );
}
