import type { MetadataRoute } from "next";
import { getStoreProducts } from "@/lib/api";
import { categorySlug } from "@/lib/slug";

// Rebuilt at most once an hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://rafiksrugs.com";
  // If the API can't be reached, the fixed pages are still listed
  const { products } = await getStoreProducts();
  const categories = [
    ...new Set(products.map((product) => categorySlug(product.category))),
  ];

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${base}/shipping-returns`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...categories.map((slug) => ({
      url: `${base}/collections/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
