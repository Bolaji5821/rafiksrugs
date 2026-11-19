import type { Metadata } from "next";
import { WishlistView } from "@/components/storefront/wishlist-view";
import { getStoreCurrency, getStoreProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The rugs you've saved at Rafik's Rugs.",
  // Personal to each visitor, so nothing for search engines to list
  robots: { index: false },
};

// Re-checks the admin's products at most once a minute
export const revalidate = 60;

export default async function WishlistPage() {
  const [{ products, failed }, currency] = await Promise.all([
    getStoreProducts(),
    getStoreCurrency(),
  ]);
  return (
    <WishlistView products={products} loadFailed={failed} currency={currency} />
  );
}
