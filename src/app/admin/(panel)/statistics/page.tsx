import type { Metadata } from "next";
import { StatisticsView } from "@/components/admin/views/StatisticsView";
import { getStats, type Range, RANGES } from "@/server/admin/stats";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Statistics" };

export default async function StatisticsPage({ searchParams }: PageProps<"/admin/statistics">) {
  await requireAdmin();
  const sp = await searchParams;
  const range = (RANGES.find((r) => String(r) === sp.range) ?? 30) as Range;
  const allEnv = sp.env === "all";
  const s = await getStats(range, allEnv);
  return <StatisticsView s={s} range={range} allEnv={allEnv} />;
}
