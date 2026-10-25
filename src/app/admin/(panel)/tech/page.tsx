import type { Metadata } from "next";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { TechManager } from "@/components/admin/TechManager";
import { TECH_ICON_KEYS } from "@/lib/tech-icons";
import { getToolbox } from "@/server/queries/public";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Tech catalog" };

export default async function TechPage() {
  await requireAdmin();
  const rows = await getToolbox();
  return (
    <>
      <AdminPageHead href="/admin/tech" />
      <TechManager rows={rows} iconKeys={TECH_ICON_KEYS} />
    </>
  );
}
