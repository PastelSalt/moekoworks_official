import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Dashboard" };

async function countWhere(table: typeof schema.projects | typeof schema.certifications, status: string) {
  const [{ value }] = await db.select({ value: count() }).from(table).where(eq(table.status, status));
  return value;
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { welcome } = await searchParams;
  const [published, drafts, certs, [{ value: unread }]] = await Promise.all([
    countWhere(schema.projects, "published"),
    countWhere(schema.projects, "draft"),
    countWhere(schema.certifications, "published"),
    db.select({ value: count() }).from(schema.contactMessages).where(eq(schema.contactMessages.status, "unread")),
  ]);
  const tiles = [
    { label: "Published projects", value: published, sub: `${drafts} draft${drafts === 1 ? "" : "s"}` },
    { label: "Certifications", value: certs, sub: "shown on About" },
    { label: "Unread messages", value: unread, sub: "from the contact form" },
  ];
  return (
    <>
      <p className="admin-label">No.00 — Dashboard</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Hello, Kyle!
      </Typography>
      {welcome && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password changed. Welcome to your admin panel ✿
        </Alert>
      )}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {tiles.map((t) => (
          <Paper key={t.label} elevation={0} sx={{ p: 2.5, boxShadow: "var(--shadow-paper)" }}>
            <p className="admin-label">{t.label}</p>
            <Typography variant="h3" component="p" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {t.value}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {t.sub}
            </Typography>
          </Paper>
        ))}
      </div>
    </>
  );
}
