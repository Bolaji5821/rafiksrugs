"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowUpRight, Check, Minus, Plus, Search } from "lucide-react";
import { money, PRODUCTS, type Product } from "@/lib/catalog";
import { CustomSelect } from "@/components/storefront/custom-select";
import "./store-pages.css";

export function StoreChrome({ children }: { children: React.ReactNode }) {
  return <div className="store-page">{children}<RouteScrollTop /></div>;
}

function RouteScrollTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const update = () => setVisible(scrollY > innerHeight * .75); update(); addEventListener("scroll", update, { passive: true }); return () => removeEventListener("scroll", update); }, []);
  return <button className={`store-scroll-top ${visible ? "visible" : ""}`} onClick={() => scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top"><ArrowUp /></button>;
}

export function CollectionView({ products = PRODUCTS, title = "All rugs", description = "Explore every texture, tone, and shape in the collection." }: { products?: Product[]; title?: string; description?: string }) {
  const [sort, setSort] = useState("featured");
  const sorted = useMemo(() => [...products].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : a.id - b.id), [products, sort]);
  return <StoreChrome><main><section className="store-hero"><Link href="/"><ArrowLeft /> Home</Link><p>Collection</p><h1>{title}</h1><span>{description}</span></section><section className="store-catalog"><div className="store-catalog-tools"><span>{sorted.length} products</span><div className="store-sort"><span>Sort</span><CustomSelect ariaLabel="Sort products" value={sort} onChange={setSort} options={[{ value: "featured", label: "Featured" }, { value: "low", label: "Price low to high" }, { value: "high", label: "Price high to low" }, { value: "name", label: "Name A to Z" }]} /></div></div><div className="store-grid">{sorted.map((product) => <StoreProductCard key={product.id} product={product} />)}</div></section><TrustBand /></main></StoreChrome>;
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
  return <div className="store-buy"><label>Size<CustomSelect ariaLabel="Rug size" value={size} onChange={setSize} options={product.sizes.map((item) => ({ value: item, label: item }))} /></label><label>Quantity<span className="store-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus /></button>{quantity}<button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus /></button></span></label><button className="store-primary" onClick={add}>{added ? <><Check /> Added to cart</> : "Add to cart"}</button><p>Free shipping over $100 · Easy returns within 30 days</p></div>;
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
