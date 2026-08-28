import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/storefront/store-pages";
import { CATEGORY_SLUGS, PRODUCTS } from "@/lib/catalog";

export function generateStaticParams() { return Object.keys(CATEGORY_SLUGS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params, category = CATEGORY_SLUGS[slug]; return category ? { title: category, description: `Shop ${category.toLowerCase()} from Rafik's Rugs.` } : {}; }
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params, category = CATEGORY_SLUGS[slug]; if (!category) notFound(); return <CollectionView title={category} description={`Distinctive ${category.toLowerCase()} selected for warmth, texture, and everyday living.`} products={PRODUCTS.filter((product) => product.category === category)} />; }
