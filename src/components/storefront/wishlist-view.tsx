"use client";

import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { StoreChrome, StoreProductCard } from "@/components/storefront/store-pages";
import { useWishlist } from "@/components/storefront/extras";

export function WishlistView({
  products,
  loadFailed = false,
  currency,
}: {
  products: Product[];
  loadFailed?: boolean;
  currency?: string;
}) {
  const { ids } = useWishlist();
  // Newest save first. A rug that was hidden or deleted in the admin just drops out.
  const saved = ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  return (
    <StoreChrome currency={currency}>
      <main>
        <section className="store-hero">
          <Link href="/">
            <ArrowLeft /> Home
          </Link>
          <p>Wishlist</p>
          <h1>Saved rugs</h1>
          <span>Rugs you&apos;ve saved on this device.</span>
        </section>
        <section className="store-catalog">
          {loadFailed ? (
            <p className="store-empty" role="alert">
              We couldn&apos;t load the rugs right now. Please try again in a
              moment.
            </p>
          ) : saved.length === 0 ? (
            <p className="store-empty">
              <Heart style={{ width: 20, height: 20, verticalAlign: "-4px" }} />{" "}
              Nothing saved yet. Tap the heart on a rug to keep it here.{" "}
              <Link href="/collections">Browse the collection</Link>
            </p>
          ) : (
            <div className="store-grid">
              {saved.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </StoreChrome>
  );
}
