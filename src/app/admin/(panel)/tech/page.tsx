import type { Metadata } from "next";
import { TechManager } from "@/components/admin/TechManager";
import { TECH_ICON_KEYS, techIcon } from "@/lib/tech-icons";
import { getToolbox } from "@/server/queries/public";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Tech catalog" };

export default async function TechPage() {
  await requireAdmin();
  const rows = await getToolbox();
  // Logos are resolved here (server only), so the whole icon set never ships to the browser.
  return <TechManager rows={rows.map((t) => ({ ...t, logo: techIcon(t.iconKey) }))} iconKeys={TECH_ICON_KEYS} />;
}
