import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductPurchase, StoreChrome, StoreProductCard, TrustBand } from "@/components/storefront/store-pages";
import { getProduct, money, PRODUCTS, relatedProducts } from "@/lib/catalog";

export function generateStaticParams() { return PRODUCTS.map((product) => ({ slug: product.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return { title: product.name, description: product.description, openGraph: { title: product.name, description: product.description, images: [product.image], type: "website" } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const related = relatedProducts(product);
  const structuredData = { "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.gallery, description: product.description, material: product.material, countryOfOrigin: product.origin, offers: { "@type": "Offer", priceCurrency: "USD", price: product.price, availability: product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };
  return <StoreChrome><main className="store-product-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><section className="store-product-layout"><div className="store-gallery">{product.gallery.map((image, index) => <img key={image} src={image} alt={index === 0 ? product.name : `${product.name} detail ${index + 1}`} />)}</div><div className="store-info"><div className="store-breadcrumb"><Link href="/collections">Shop</Link> / <Link href={`/collections/${product.category.toLowerCase().replace(" ", "-")}`}>{product.category}</Link></div><h1>{product.name}</h1><p>{product.oldPrice && <s>{money(product.oldPrice)}</s>} {money(product.price)}</p><p className="store-description">{product.description}</p><p className="store-stock">{product.inventory > 5 ? "In stock and ready to ship" : `Low stock · ${product.inventory} remaining`}</p><div className="store-specs"><div>Material <span>{product.material}</span></div><div>Origin <span>{product.origin}</span></div><div>Style <span>{product.style}</span></div><div>Available sizes <span>{product.sizes.join(", ")}</span></div><div>Care <span>{product.care}</span></div></div><ProductPurchase product={product} /></div></section>{related.length > 0 && <section className="store-related"><p>Complete the room</p><h2>You may also like</h2><div className="store-grid">{related.map((item) => <StoreProductCard key={item.id} product={item} />)}</div></section>}<TrustBand /></main></StoreChrome>;
}
