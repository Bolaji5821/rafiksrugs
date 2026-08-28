import type { Metadata } from "next";
import { CollectionView } from "@/components/storefront/store-pages";

export const metadata: Metadata = { title: "Shop all rugs", description: "Browse area rugs, runners, shag rugs, and vintage-inspired designs from Rafik's Rugs." };
export default function CollectionsPage() { return <CollectionView />; }
