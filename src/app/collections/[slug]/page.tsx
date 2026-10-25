import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/storefront/store-pages";
import { getStoreProducts } from "@/lib/api";
import { categorySlug } from "@/lib/slug";

// Re-checks the admin's products at most once a minute
export const revalidate = 60;

// A category page exists for every category that has at least one visible
// product. The category name comes from the admin.
async function loadCategory(slug: string) {
  const { products, failed } = await getStoreProducts();
  const inCategory = products.filter(
    (product) => categorySlug(product.category) === slug,
  );
  return { failed, category: inCategory[0]?.category, products: inCategory };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { category } = await loadCategory((await params).slug);
  return category
    ? {
        title: category,
        description: `Shop ${category.toLowerCase()} from Rafik's Rugs.`,
      }
    : {};
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { failed, category, products } = await loadCategory(
    (await params).slug,
  );
  // If the API is down we can't tell a missing category from an empty list,
  // so show an error instead of a wrong "not found"
  if (failed) throw new Error("Could not load the products");
  if (!category) notFound();
  return (
    <CollectionView
      title={category}
      description={`Distinctive ${category.toLowerCase()} selected for warmth, texture, and everyday living.`}
      products={products}
    />
  );
}
