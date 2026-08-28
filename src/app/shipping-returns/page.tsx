import type { Metadata } from "next";
import { StoreChrome } from "@/components/storefront/store-pages";

export const metadata: Metadata = { title: "Shipping, returns and rug care", description: "Shipping, return, and practical rug-care guidance for Rafik's Rugs customers." };

export default function ShippingReturnsPage() {
  return <StoreChrome><main><section className="store-hero"><p>Customer care</p><h1>Shipping, returns &amp; rug care</h1><span>Clear guidance for buying confidently and keeping your rug looking its best.</span></section><section className="policy-grid"><article><span>01</span><h2>Shipping</h2><p>Orders over $100 qualify for free shipping. Final delivery estimates and available methods should be confirmed by the connected commerce platform during checkout.</p></article><article><span>02</span><h2>Returns</h2><p>Returns are accepted within 30 days under the store&apos;s easy-return promise. Final eligibility, item condition, and return-shipping terms must be confirmed in the production policy.</p></article><article id="care"><span>03</span><h2>Everyday care</h2><p>Vacuum using the setting recommended on each product page, rotate rugs periodically, and blot spills immediately. Avoid rubbing, which can push stains deeper into the fibers.</p></article><article><span>04</span><h2>Need help?</h2><p>Use the rug-request form if you need help finding the right size, style, material, or color for your room.</p></article></section></main></StoreChrome>;
}
