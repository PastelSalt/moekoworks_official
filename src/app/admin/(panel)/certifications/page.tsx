import Typography from "@mui/material/Typography";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { CertificationManager } from "@/components/admin/CertificationManager";
import { requireAdmin } from "@/server/auth/session";
import { db, schema } from "@/server/db";

export const metadata: Metadata = { title: "Certifications" };

export default async function CertificationsPage() {
  await requireAdmin();
  const rows = await db
    .select({ id: schema.certifications.id, title: schema.certifications.title, obtainedOn: schema.certifications.obtainedOn, status: schema.certifications.status, mediaId: schema.certifications.mediaId, publicId: schema.mediaAssets.publicId, altText: schema.mediaAssets.altText })
    .from(schema.certifications)
    .innerJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.certifications.mediaId))
    .orderBy(desc(schema.certifications.obtainedOn));
  return (
    <>
      <p className="admin-label">No.02 — Certifications</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Certifications
      </Typography>
      <CertificationManager rows={rows} uploads={Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)} />
    </>
  );
}
