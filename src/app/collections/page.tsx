import type { Metadata } from "next";
import { CollectionView } from "@/components/storefront/store-pages";
import { getStoreCurrency, getStoreProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Shop all rugs",
  description:
    "Browse area rugs, runners, shag rugs, and vintage-inspired designs from Rafik's Rugs.",
};

// Re-checks the admin's products at most once a minute
export const revalidate = 60;

export default async function CollectionsPage() {
  const [{ products, failed }, currency] = await Promise.all([
    getStoreProducts(),
    getStoreCurrency(),
  ]);
  return (
    <CollectionView
      products={products}
      loadFailed={failed}
      currency={currency}
    />
  );
}
