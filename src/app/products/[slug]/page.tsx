import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import {
  ProductPurchase,
  StoreChrome,
  StoreProductCard,
  TrustBand,
} from "@/components/storefront/store-pages";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { Price } from "@/components/storefront/currency-switcher";
import { BackButton } from "@/components/storefront/extras";
import { FREE_SHIPPING_OVER } from "@/lib/shipping";
import { getStoreCurrency, getStoreProduct, getStoreProducts } from "@/lib/api";
import { categorySlug, productIdFromSlug } from "@/lib/slug";

// Re-checks the admin's products at most once a minute
export const revalidate = 60;

// The address ends with the product's id ("persian-runner-12"), which is how it is found
async function loadProduct(slug: string) {
  const id = productIdFromSlug(slug);
  if (id === null) return { product: null, failed: false };
  return getStoreProduct(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { product } = await loadProduct((await params).slug);
  if (!product) return {};
  const description =
    product.description || `${product.name} from Rafik's Rugs.`;
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: [product.image],
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { product, failed } = await loadProduct(slug);
  // If the API is down we can't tell a missing product from a broken connection
  if (failed) throw new Error("Could not load the product");
  if (!product) notFound();
  // If the product was renamed, send old links to the current address
  if (slug !== product.slug) permanentRedirect(`/products/${product.slug}`);

  const [{ products: all }, currency] = await Promise.all([
    getStoreProducts(),
    getStoreCurrency(),
  ]);
  const related = all
    .filter(
      (item) => item.id !== product.id && item.category === product.category,
    )
    .slice(0, 4);

  const inStock =
    product.availability === undefined || product.availability === "in_stock";
  // The three quick facts shown as tiles; everything else is under "Details"
  const facts = [
    ["Material", product.material],
    ["Origin", product.origin],
    ["Style", product.style],
  ].filter(([, value]) => value);
  const specs = [
    ["Material", product.material],
    ["Origin", product.origin],
    ["Style", product.style],
    ["Available sizes", product.sizes.join(", ")],
    ["Care", product.care],
  ].filter(([, value]) => value);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.gallery,
    description: product.description || undefined,
    material: product.material || undefined,
    countryOfOrigin: product.origin || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  return (
    <StoreChrome currency={currency}>
      <main className="store-product-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <div className="store-back-bar">
          <BackButton fallback="/collections" />
        </div>
        <section className="store-product-layout">
          <ProductGallery images={product.gallery} productName={product.name} />
          <div className="store-info">
            <div className="store-breadcrumb">
              <Link href="/collections">Shop</Link> /{" "}
              <Link href={`/collections/${categorySlug(product.category)}`}>
                {product.category}
              </Link>
            </div>
            {(product.newArrival || (product.oldPrice && inStock)) && (
              <div className="store-badges">
                {product.oldPrice && inStock && <span>Sale</span>}
                {product.newArrival && inStock && (
                  <span className="store-badge-new">New</span>
                )}
              </div>
            )}
            <h1>{product.name}</h1>
            <p>
              {product.oldPrice && (
                <s>
                  <Price value={product.oldPrice} />
                </s>
              )}{" "}
              <Price value={product.price} />
            </p>
            <p className="store-stock">
              {product.availability === "sold_out"
                ? "Sold out"
                : product.availability === "unavailable"
                  ? "Currently unavailable"
                  : "In stock and ready to ship"}
            </p>
            {facts.length > 0 && (
              <div className="store-facts">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
            <ProductPurchase product={product} />
            <div className="store-accordion">
              {product.description && (
                <details open>
                  <summary>Description</summary>
                  <p>{product.description}</p>
                </details>
              )}
              {specs.length > 0 && (
                <details>
                  <summary>Details</summary>
                  <dl>
                    {specs.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
              <details>
                <summary>Shipping &amp; returns</summary>
                <p>
                  Free shipping on orders over{" "}
                  <Price value={FREE_SHIPPING_OVER} />. Easy returns within 30
                  days.
                </p>
              </details>
            </div>
          </div>
        </section>
        {related.length > 0 && (
          <section className="store-related">
            <p>Complete the room</p>
            <h2>You may also like</h2>
            <div className="store-grid">
              {related.map((item) => (
                <StoreProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
        <TrustBand />
      </main>
    </StoreChrome>
  );
}
