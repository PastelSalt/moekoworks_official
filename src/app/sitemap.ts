import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getPublishedProjects } from "@/server/queries/public";

export const revalidate = 3600;

// The admin is never listed (plan §5.2).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = [];
  try {
    projects = await getPublishedProjects();
  } catch {
    projects = [];
  }
  const latest = projects[0]?.publishedAt ?? new Date();
  return [
    { url: `${base}/`, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/history`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...projects.map((p) => ({ url: `${base}/history/${p.slug}`, lastModified: p.publishedAt ?? undefined, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
