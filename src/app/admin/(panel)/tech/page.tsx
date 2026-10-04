import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
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
      <p className="admin-label">No.06 — Tech catalog</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Tech catalog
      </Typography>
      <TechManager rows={rows} iconKeys={TECH_ICON_KEYS} />
    </>
  );
}
