import type { Metadata } from "next";
import { RafiksStorefront } from "@/components/storefront/rafiks-storefront";
import { getStoreCurrency, getStoreProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Rafik's Rugs — Handwoven Rugs Online",
  description:
    "Browse handwoven rugs at Rafik's Rugs. Shop area rugs, runners, and more with fast shipping and easy returns.",
};

export default async function Home() {
  const [{ products, failed }, currency] = await Promise.all([
    getStoreProducts(),
    getStoreCurrency(),
  ]);
  return (
    <RafiksStorefront
      products={products}
      loadFailed={failed}
      currency={currency}
    />
  );
}
