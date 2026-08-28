import type { MetadataRoute } from "next";
import { CATEGORY_SLUGS, PRODUCTS } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://rafiksrugs.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: .9 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: .5 },
    { url: `${base}/shipping-returns`, changeFrequency: "monthly", priority: .5 },
    ...Object.keys(CATEGORY_SLUGS).map((slug) => ({ url: `${base}/collections/${slug}`, changeFrequency: "weekly" as const, priority: .8 })),
    ...PRODUCTS.map((product) => ({ url: `${base}/products/${product.slug}`, changeFrequency: "weekly" as const, priority: .8 })),
  ];
}
