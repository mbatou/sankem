import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { getActiveProductSlugs } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.url.replace(/\/$/, "");
  let slugs: string[] = [];
  try {
    slugs = await getActiveProductSlugs();
  } catch {
    // Supabase not configured at build time — emit static routes only.
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.8 },
  ];
  const productRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/product/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
