"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowUpRight, Check, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { money, PRODUCTS, type Product } from "@/lib/catalog";
import "./store-pages.css";

export function StoreChrome({ children }: { children: React.ReactNode }) {
  return <div className="store-page"><header className="store-header"><Link className="store-brand-logo" href="/" aria-label="Rafik's Rugs home"><Image src="/RafiksRugs.png" alt="" width={300} height={300} priority /></Link><nav><Link href="/collections">Shop</Link><Link href="/search"><Search /> Search</Link><Link href="/#request">Request a rug</Link><Link href="/"><ShoppingBag /> Cart</Link></nav></header>{children}<footer className="store-footer"><strong className="store-footer-logo"><Image src="/RafiksRugs.png" alt="Rafik's Rugs" width={900} height={900} /></strong><div><span>Handwoven character for rooms with soul.</span><nav><Link href="/collections">Shop all</Link><Link href="/#request">Request a rug</Link><Link href="/search">Search</Link><Link href="/shipping-returns">Shipping &amp; returns</Link></nav></div><small>© 2026 Rafik&apos;s Rugs · Privacy · Terms</small></footer><RouteScrollTop /></div>;
}

function RouteScrollTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const update = () => setVisible(scrollY > innerHeight * .75); update(); addEventListener("scroll", update, { passive: true }); return () => removeEventListener("scroll", update); }, []);
  return <button className={`store-scroll-top ${visible ? "visible" : ""}`} onClick={() => scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top"><ArrowUp /></button>;
}

export function CollectionView({ products = PRODUCTS, title = "All rugs", description = "Explore every texture, tone, and shape in the collection." }: { products?: Product[]; title?: string; description?: string }) {
  const [sort, setSort] = useState("featured");
  const sorted = useMemo(() => [...products].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : a.id - b.id), [products, sort]);
  return <StoreChrome><main><section className="store-hero"><Link href="/"><ArrowLeft /> Home</Link><p>Collection</p><h1>{title}</h1><span>{description}</span></section><section className="store-catalog"><div className="store-catalog-tools"><span>{sorted.length} products</span><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price low to high</option><option value="high">Price high to low</option><option value="name">Name A to Z</option></select></label></div><div className="store-grid">{sorted.map((product) => <StoreProductCard key={product.id} product={product} />)}</div></section><TrustBand /></main></StoreChrome>;
}

export function StoreProductCard({ product }: { product: Product }) {
  return <article className="store-product">{product.oldPrice && <em>Sale</em>}<Link href={`/products/${product.slug}`}><img src={product.image} alt={product.name} /><div><p>{product.category}</p><h2>{product.name}</h2><span>{product.oldPrice && <s>{money(product.oldPrice)}</s>} {money(product.price)}</span></div></Link></article>;
}

export function ProductPurchase({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = () => {
    const stored = JSON.parse(localStorage.getItem("rafiks-cart") || "[]");
    const found = stored.find((item: { id: number; size?: string }) => item.id === product.id && item.size === size);
    const next = found ? stored.map((item: { id: number; size?: string; quantity: number }) => item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item) : [...stored, { ...product, size, quantity }];
    localStorage.setItem("rafiks-cart", JSON.stringify(next)); setAdded(true);
  };
  return <div className="store-buy"><label>Size<select value={size} onChange={(event) => setSize(event.target.value)}>{product.sizes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Quantity<span className="store-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus /></button>{quantity}<button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus /></button></span></label><button className="store-primary" onClick={add}>{added ? <><Check /> Added to cart</> : "Add to cart"}</button><p>Free shipping over $100 · Easy returns within 30 days</p></div>;
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => { const value = query.trim().toLowerCase(); return value ? PRODUCTS.filter((product) => `${product.name} ${product.category} ${product.style} ${product.material}`.toLowerCase().includes(value)) : PRODUCTS; }, [query]);
  return <StoreChrome><main><section className="store-search"><p>Search the collection</p><label><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘runner’, ‘wool’, or ‘vintage’" /></label><span>{results.length} results</span></section><section className="store-catalog"><div className="store-grid">{results.map((product) => <StoreProductCard key={product.id} product={product} />)}</div></section></main></StoreChrome>;
}

export function NewsletterBand() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSent(true); };
  return <section className="store-news"><div><p>New rugs, thoughtfully selected</p><h2>Join the rug notes.</h2></div><form onSubmit={submit}><input type="email" required placeholder="Email address" aria-label="Email address" /><button>{sent ? "Subscribed" : <>Subscribe <ArrowUpRight /></>}</button></form></section>;
}

export function TrustBand() { return <><section className="store-trust"><div><strong>30-day returns</strong><span>Time to see it in your room.</span></div><div><strong>Secure checkout</strong><span>Protected payment experience.</span></div><div><strong>Care guidance</strong><span>Practical support for every rug.</span></div><div><strong>Thoughtful sourcing</strong><span>Selected for character and quality.</span></div></section><NewsletterBand /></>; }
