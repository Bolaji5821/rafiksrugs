import type { Metadata } from "next";
import { SearchView } from "@/components/storefront/store-pages";
import { getStoreCurrency, getStoreProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Search rugs",
  description:
    "Search Rafik's Rugs by style, material, category, or product name.",
};

// Re-checks the admin's products at most once a minute
export const revalidate = 60;

export default async function SearchPage() {
  const [{ products, failed }, currency] = await Promise.all([
    getStoreProducts(),
    getStoreCurrency(),
  ]);
  return (
    <SearchView products={products} loadFailed={failed} currency={currency} />
  );
}
