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
        <section className="store-product-layout">
          <ProductGallery images={product.gallery} productName={product.name} />
          <div className="store-info">
            <div className="store-breadcrumb">
              <Link href="/collections">Shop</Link> /{" "}
              <Link href={`/collections/${categorySlug(product.category)}`}>
                {product.category}
              </Link>
            </div>
            <h1>{product.name}</h1>
            <p>
              {product.oldPrice && (
                <s>
                  <Price value={product.oldPrice} />
                </s>
              )}{" "}
              <Price value={product.price} />
            </p>
            {product.description && (
              <p className="store-description">{product.description}</p>
            )}
            <p className="store-stock">
              {product.availability === "sold_out"
                ? "Sold out"
                : product.availability === "unavailable"
                  ? "Currently unavailable"
                  : "In stock and ready to ship"}
            </p>
            {specs.length > 0 && (
              <div className="store-specs">
                {specs.map(([label, value]) => (
                  <div key={label}>
                    {label} <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
            <ProductPurchase product={product} />
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
