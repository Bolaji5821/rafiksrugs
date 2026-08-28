import type { Metadata } from "next";
import { SearchView } from "@/components/storefront/store-pages";

export const metadata: Metadata = { title: "Search rugs", description: "Search Rafik's Rugs by style, material, category, or product name." };
export default function SearchPage() { return <SearchView />; }
