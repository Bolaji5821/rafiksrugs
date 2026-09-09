"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import "./site-chrome.css";

const paymentMethods = [
  { name: "American Express", image: "/payment-methods/american-express.svg" },
  { name: "Apple Pay", image: "/payment-methods/apple-pay.svg" },
  { name: "Diners Club", image: "/payment-methods/diners-club.svg" },
  { name: "Discover", image: "/payment-methods/discover.svg" },
  { name: "Google Pay", image: "/payment-methods/google-pay.svg" },
  { name: "Mastercard", image: "/payment-methods/mastercard.svg" },
  { name: "PayPal", image: "/payment-methods/paypal.svg" },
  { name: "Visa", image: "/payment-methods/visa.svg" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasImmersiveChrome = pathname === "/";

  return <>{!hasImmersiveChrome && <SiteHeader />}{children}{!hasImmersiveChrome && <SiteFooter />}</>;
}

export function SiteHeader() {
  return <header className="site-header"><Link className="site-header-logo" href="/" aria-label="Rafik's Rugs home"><Image src="/RafiksRugs.png" alt="" width={300} height={300} priority /></Link><nav aria-label="Store navigation"><Link href="/collections">Shop</Link><Link href="/search"><Search /> Search</Link><Link href="/#request">Request a rug</Link><Link href="/"><ShoppingBag /> Cart</Link></nav></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="site-footer-logo"><Image src="/RafiksRugs_white.png?v=2" alt="Rafik's Rugs" width={900} height={900} unoptimized /></div><div className="site-footer-grid"><div><small>Explore</small><Link href="/collections">Shop all</Link><Link href="/#request">Request a rug</Link><Link href="/search">Search</Link></div><div><small>Customer care</small><Link href="/shipping-returns">Shipping &amp; returns</Link><Link href="/shipping-returns#care">Rug care</Link></div><div className="site-footer-commerce"><a className="site-follow-shop" href="https://shop.app" target="_blank" rel="noreferrer"><Heart aria-hidden="true" /> Follow on <strong>shop</strong></a><small>Payment methods</small><div className="site-payment-methods" aria-label="Accepted payment methods">{paymentMethods.map((method) => <span key={method.name} title={method.name}><img src={method.image} alt={method.name} /></span>)}<span className="site-shop-pay" title="Shop Pay" aria-label="Shop Pay"><b>shop</b><i>Pay</i></span></div></div></div><p>© 2026 Rafik&apos;s Rugs · Privacy · Terms · Shipping policy</p></footer>;
}
