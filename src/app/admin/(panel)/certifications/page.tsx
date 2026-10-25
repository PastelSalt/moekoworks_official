import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
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
      <AdminPageHead href="/admin/certifications" hint="Certificates and term grade reports shown on About. Titles starting with “Grades:” are grade reports." />
      <CertificationManager rows={rows} uploads={Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)} />
    </>
  );
}
