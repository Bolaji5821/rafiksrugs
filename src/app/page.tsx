import type { Metadata } from "next";
import { RafiksStorefront } from "@/components/storefront/rafiks-storefront";

export const metadata: Metadata = {
  title: "Rafik's Rugs — Handwoven Rugs Online",
  description:
    "Browse handwoven rugs at Rafik's Rugs. Shop area rugs, runners, and more with fast shipping and easy returns.",
};

export default function Home() {
  return <RafiksStorefront />;
}
