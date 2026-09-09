"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, ImagePlus, Menu, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import NextImage from "next/image";
import { money, PRODUCTS, type Product } from "@/lib/catalog";
import { CustomSelect } from "@/components/storefront/custom-select";
import { SiteFooter } from "@/components/storefront/site-chrome";
import "./storefront.css";

type CartItem = Product & { quantity: number };

const categories = [
  { name: "Area rugs", image: PRODUCTS[0].image, count: 2 },
  { name: "Runners", image: PRODUCTS[3].image, count: 2 },
  { name: "Shag", image: PRODUCTS[4].image, count: 2 },
  { name: "Vintage", image: PRODUCTS[2].image, count: 2 },
];

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


export function RafiksStorefront() {
  const lenisRef = useRef<Lenis | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [requestImage, setRequestImage] = useState<{ name: string; url: string } | null>(null);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const categorySectionRef = useRef<HTMLElement>(null);
  const categoryStickyRef = useRef<HTMLDivElement>(null);
  const categoryViewportRef = useRef<HTMLDivElement>(null);
  const categoryTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const started = performance.now();
    let frame = 0;
    const ease = (value: number) => value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
    const tick = (now: number) => {
      const next = Math.round(ease(Math.min((now - started) / 1300, 1)) * 100);
      setProgress(next);
      if (next < 100) frame = requestAnimationFrame(tick);
      else window.setTimeout(() => setLoaded(true), 260);
    };
    frame = requestAnimationFrame(tick);
    const cartTimer = window.setTimeout(() => {
      try { setCart(JSON.parse(localStorage.getItem("rafiks-cart") || "[]")); } catch { setCart([]); }
    }, 0);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(cartTimer); };
  }, []);

  useEffect(() => {
    if (!loaded || localStorage.getItem("rafiks-newsletter-seen")) return;
    const timer = window.setTimeout(() => setNewsletterOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, anchors: true }); lenisRef.current = lenis;
    gsap.registerPlugin(ScrollTrigger);
    const updateScrollTrigger = () => ScrollTrigger.update();
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => { lenis.off("scroll", updateScrollTrigger); gsap.ticker.remove(raf); lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    const locked = !loaded || menuOpen || searchOpen || cartOpen || checkout || newsletterOpen;
    document.documentElement.classList.toggle("rr-locked", locked);
    if (locked) lenisRef.current?.stop(); else lenisRef.current?.start();
    return () => document.documentElement.classList.remove("rr-locked");
  }, [loaded, menuOpen, searchOpen, cartOpen, checkout, newsletterOpen]);

  useEffect(() => {
    const applyGrid = () => {
      const width = window.innerWidth;
      const reduction = ((1920 - width) / 1920) * 100;
      const size = 16 - (16 * (reduction * 0.6666)) / 100;
      if (size > 16) document.documentElement.style.fontSize = `${size}px`;
      else document.documentElement.style.removeProperty("font-size");
    };
    applyGrid();
    window.addEventListener("resize", applyGrid);
    return () => { window.removeEventListener("resize", applyGrid); document.documentElement.style.removeProperty("font-size"); };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setFeatureIndex((index) => (index + 1) % PRODUCTS.length), 3500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const update = () => { setShowScrollTop(window.scrollY > window.innerHeight * 0.75); setHeaderScrolled(window.scrollY > 24); };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const section = categorySectionRef.current;
    const sticky = categoryStickyRef.current;
    const viewport = categoryViewportRef.current;
    const track = categoryTrackRef.current;
    if (!section || !sticky || !viewport || !track) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(max-width: 640px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: section,
          pinSpacing: true,
          pinType: "fixed",
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.set(track, { clearProps: "transform" }); };
    });
    return () => media.revert();
  }, []);

  useEffect(() => {
    localStorage.setItem("rafiks-cart", JSON.stringify(cart));
  }, [cart]);

  const catalog = useMemo(() => {
    const list = PRODUCTS.filter((product) => filter === "All" || product.category === filter || (filter === "Sale" && product.oldPrice));
    return [...list].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : a.id - b.id);
  }, [filter, sort]);

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? PRODUCTS.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(value)) : PRODUCTS.slice(0, 4);
  }, [query]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: Product, open = true) => {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      return existing ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }];
    });
    if (open) setCartOpen(true);
  };

  const updateQuantity = (id: number, change: number) => setCart((items) => items.map((item) => item.id === id ? { ...item, quantity: item.quantity + change } : item).filter((item) => item.quantity > 0));

  const shopCategory = (name: string) => {
    setFilter(name);
    lenisRef.current?.scrollTo("#collection", { duration: 1.1 });
  };

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const request = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
    const image = form.get("referenceImage");
    const existing = JSON.parse(localStorage.getItem("rafiks-rug-requests") || "[]");
    localStorage.setItem("rafiks-rug-requests", JSON.stringify([...existing, { ...request, referenceImage: image instanceof File && image.size ? { name: image.name, type: image.type, size: image.size } : null, createdAt: new Date().toISOString() }]));
    event.currentTarget.reset();
    if (requestImage) URL.revokeObjectURL(requestImage.url);
    setRequestImage(null);
    setRequestSent(true);
  };

  const dismissNewsletter = () => {
    localStorage.setItem("rafiks-newsletter-seen", "true");
    setNewsletterOpen(false);
  };

  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    if (!email) return;
    const subscribers = JSON.parse(localStorage.getItem("rafiks-newsletter-subscribers") || "[]");
    localStorage.setItem("rafiks-newsletter-subscribers", JSON.stringify([...new Set([...subscribers, email])]));
    localStorage.setItem("rafiks-newsletter-seen", "true");
    event.currentTarget.reset();
    setNewsletterSent(true);
  };

  const submitCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckoutStep((step) => step + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false); setSearchOpen(false); setCartOpen(false); setCheckout(false);
      if (newsletterOpen) { localStorage.setItem("rafiks-newsletter-seen", "true"); setNewsletterOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newsletterOpen]);

  return (
    <div className={`rr-site ${loaded ? "rr-ready" : ""}`}>
      <a className="rr-skip" href="#main">Skip to content</a>
      <div className={`rr-loader ${loaded ? "is-loaded" : ""}`}><div className="rr-loader-center"><span className="rr-loader-logo"><NextImage src="/RafiksRugs_white.png?v=2" alt="Rafik's Rugs" width={300} height={300} loading="eager" unoptimized /></span><p>Handwoven character, sourced with utmost care.</p></div><div className="rr-loader-progress"><i><span style={{ width: `${progress}%` }} /></i><div><span>Loading</span><b>{String(progress).padStart(3, "0")}</b></div></div></div>
      <header className={`rr-header rr-ready-reveal ${headerScrolled ? "is-scrolled" : ""}`}>
        <div className="rr-announcement">Free shipping on orders over $100 · Easy returns within 30 days</div>
        <nav className="rr-nav" aria-label="Primary navigation">
          <button onClick={() => setMenuOpen(true)}><Menu size={18} /><span>Menu</span></button>
          <a className="rr-logo" href="#home" aria-label="Rafik's Rugs home"><span><NextImage src="/RafiksRugs_white.png?v=2" alt="" width={300} height={300} loading="eager" unoptimized /></span></a>
          <div className="rr-nav-actions"><button onClick={() => setSearchOpen(true)}><Search size={18} /><span>Search</span></button><button className="rr-cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}><ShoppingBag size={20} /><i>{itemCount}</i></button></div>
        </nav>
      </header>

      <main id="main">
        <section className="rr-hero" id="home">
          <LiquidReveal before={PRODUCTS[0].image} after={PRODUCTS[2].image} />
          <div className="rr-hero-vignette" /><div className="rr-hero-watermark">RAFIK&apos;S</div>
          <div className="rr-hero-copy"><p className="rr-kicker rr-hero-enter rr-delay-1">Made for homes with soul, And built to last</p><h1><span><i>Browse our</i></span><span><i>latest products</i></span></h1><button className="rr-pill rr-light rr-hero-enter rr-delay-4" onClick={() => lenisRef.current?.scrollTo("#collection", { duration: 1.1 })}>Shop all <ArrowUpRight /></button></div>
          <aside className="rr-feature-card rr-hero-enter rr-delay-3" aria-label="Featured product spotlight">
            <Link className="rr-feature-link" href={`/products/${PRODUCTS[featureIndex].slug}`} aria-label={`View ${PRODUCTS[featureIndex].name}`}>
              <span className="rr-feature-media"><img src={PRODUCTS[featureIndex].image} alt={PRODUCTS[featureIndex].name} /><i>View rug <ArrowUpRight /></i></span>
              <span className="rr-feature-meta"><span><strong>{PRODUCTS[featureIndex].name}</strong><small>{money(PRODUCTS[featureIndex].price)}</small></span><b>{String(featureIndex + 1).padStart(2, "0")} / {String(PRODUCTS.length).padStart(2, "0")}</b></span>
            </Link>
            <div className="rr-feature-nav">
              <div className="rr-feature-dots">{PRODUCTS.map((product, index) => <button key={product.id} className={index === featureIndex ? "active" : ""} onClick={() => setFeatureIndex(index)} aria-label={`Show ${product.name}`} aria-current={index === featureIndex ? "true" : undefined} />)}</div>
              <div className="rr-feature-arrows"><button onClick={() => setFeatureIndex((featureIndex - 1 + PRODUCTS.length) % PRODUCTS.length)} aria-label="Previous featured product"><ArrowLeft /></button><button onClick={() => setFeatureIndex((featureIndex + 1) % PRODUCTS.length)} aria-label="Next featured product"><ArrowRight /></button></div>
            </div>
          </aside>
        </section>

        <section ref={categorySectionRef} className="rr-section rr-categories" id="categories"><div ref={categoryStickyRef} className="rr-category-sticky"><Reveal><SectionHeading kicker="Find your foundation" title="Shop by category" /></Reveal><div ref={categoryViewportRef} className="rr-category-viewport"><div ref={categoryTrackRef} className="rr-category-grid">{categories.map((category, index) => <Reveal key={category.name} delay={index * 120}><button className="rr-category" onClick={() => shopCategory(category.name)}><img src={category.image} alt={`${category.name} collection`} /><span><strong>{category.name}</strong><small>{category.count} pieces <ArrowUpRight /></small></span></button></Reveal>)}</div></div></div></section>

        <section className="rr-create-band" aria-label="Why shop Rafik's Rugs">{[
          "Made for living homes",
          "Affordable prices",
          "Premium Quality",
          "Carefully sourced",
            ].map((promise, index) => <Reveal key={promise} delay={index * 120}><span className={`rr-create-${index + 1}`}>{promise}</span></Reveal>)}</section>

        <section className="rr-spotlight" id="spotlight"><Reveal className="rr-spot-image"><img src={PRODUCTS[0].image} alt="Glam White and Gold Rug in a warm living room" /></Reveal><Reveal className="rr-spot-copy" delay={120}><p className="rr-kicker">Product spotlight / 01</p><h2>Glam White &amp; Gold Rug</h2><p className="rr-price">{money(129.99)}</p><p>Soft underfoot, carefully finished, and designed to bring luminous warmth to everyday rooms.</p><button className="rr-button" onClick={() => addToCart(PRODUCTS[0])}>Add to cart</button><button className="rr-button rr-terra" onClick={() => { addToCart(PRODUCTS[0], false); setCheckout(true); }}>Buy now</button></Reveal></section>

        <section className="rr-section rr-collection" id="collection"><Reveal><SectionHeading kicker="Collection / 2026" title="Find the perfect rug for your space" /></Reveal><div className="rr-tools"><div className="rr-filters">{["All", "Area rugs", "Runners", "Shag", "Vintage", "Sale"].map((name) => <button key={name} className={filter === name ? "active" : ""} onClick={() => setFilter(name)}>{name}</button>)}</div><div className="rr-sort"><span>Sort</span><CustomSelect ariaLabel="Sort products" value={sort} onChange={setSort} options={[{ value: "featured", label: "Featured" }, { value: "low", label: "Price low to high" }, { value: "high", label: "Price high to low" }, { value: "name", label: "Name A to Z" }]} /></div></div><div className="rr-products">{catalog.map((product, index) => <Reveal key={product.id} delay={index * 90}><ProductCard product={product} onAdd={addToCart} /></Reveal>)}</div></section>

        <Stats />

        <section className="rr-request" id="request"><Reveal><div><p className="rr-kicker">Can&apos;t find your dream rug?</p><h2>Tell us what you want, We source the perfect fit</h2>
        <br />
        <p>Share size, style, colors, budget, and a reference image. Our sourcing team will review your request and follow up with available options.</p></div></Reveal><Reveal delay={120}>{requestSent ? <div className="rr-request-success"><Check /><h3>Request received</h3><p>We saved your request on this device for this storefront prototype.</p><button onClick={() => setRequestSent(false)}>Send another request</button></div> : <form onSubmit={submitRequest}><label>Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label><label>Rug type<CustomSelect ariaLabel="Rug type" name="type" required placeholder="Select a type" options={["Area rug", "Runner", "Shag", "Vintage", "Custom"].map((label) => ({ value: label, label }))} /></label><label>Preferred size<input name="size" placeholder="e.g. 8 × 10 ft" required /></label><label>Budget<input name="budget" placeholder="e.g. $150–$300" required /></label><label className="wide rr-request-upload">Reference image<span className="rr-upload-control"><input name="referenceImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (requestImage) URL.revokeObjectURL(requestImage.url); setRequestImage(file ? { name: file.name, url: URL.createObjectURL(file) } : null); }} /><span>{requestImage ? <img src={requestImage.url} alt="Selected rug reference" /> : <ImagePlus aria-hidden="true" />}<b>{requestImage ? requestImage.name : "Upload a rug photo"}</b><small>JPG, PNG, or WebP</small></span></span></label><label className="wide">Describe your ideal rug<textarea name="description" rows={4} placeholder="Colors, material, pattern, room, or reference details" required /></label><button className="rr-button wide">Request this rug <ArrowUpRight /></button></form>}</Reveal></section>

        <section className="rr-story"><Reveal><p className="rr-kicker">Our story / Our craft</p></Reveal><Reveal className="rr-story-copy" delay={120}><h2>A better rug should make the whole room feel considered.</h2><p>We source rugs for real homes, choosing every piece for comfort, durability, and character. Clear guidance helps you find the right size and style without guesswork.</p><ul className="rr-story-points"><li><strong>Chosen with intention</strong><span>Distinctive designs and materials selected for everyday living.</span></li><li><strong>Guidance that helps</strong><span>Straightforward details on size, feel, care, and placement.</span></li><li><strong>Made to live with</strong><span>Comfortable, durable pieces meant to become part of your home.</span></li></ul></Reveal></section>
        <section className="rr-newsletter"><Reveal><h2>Subscribe to our emails and get new rug designs as we release.</h2></Reveal><Reveal delay={120}><form onSubmit={submitNewsletter}><input name="email" type="email" placeholder="Email address" required /><button>Subscribe <ArrowUpRight /></button></form></Reveal></section>
      </main>

      <SiteFooter />

      {newsletterOpen && <div className="rr-newsletter-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissNewsletter(); }}><section role="dialog" aria-modal="true" aria-labelledby="newsletter-title"><button className="rr-newsletter-close" onClick={dismissNewsletter} aria-label="Close newsletter signup"><X /></button><div className="rr-newsletter-art"><img src={PRODUCTS[2].image} alt="" /></div><div className="rr-newsletter-content">{newsletterSent ? <><span className="rr-newsletter-check"><Check /></span><p className="rr-kicker">You&apos;re on the list</p><h2>Welcome home.</h2><p>New rug designs and thoughtful finds will come to your inbox.</p><button className="rr-button" onClick={dismissNewsletter}>Continue shopping</button></> : <><p className="rr-kicker">A more considered home</p><h2 id="newsletter-title">New rugs, first look.</h2><p>Join our newsletter for new designs, sourcing stories, and room inspiration.</p><form onSubmit={submitNewsletter}><label htmlFor="newsletter-email">Email address</label><div><input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" autoFocus required /><button type="submit" aria-label="Subscribe to newsletter"><ArrowUpRight /></button></div></form><button className="rr-newsletter-skip" onClick={dismissNewsletter}>No thanks, continue shopping</button></>}</div></section></div>}

      <Panel open={menuOpen} className="rr-menu-panel" close={() => setMenuOpen(false)} title="Menu"><nav>{[["Home", "home"], ["Categories", "categories"], ["Shop all", "collection"], ["Request a rug", "request"]].map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}<button onClick={() => { setMenuOpen(false); setSearchOpen(true); }}>Search</button></nav></Panel>
      <Panel open={searchOpen} close={() => setSearchOpen(false)} title="Search"><div className="rr-search"><label><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rugs" /></label><div className="rr-search-results">{searchResults.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div></div></Panel>
      <Panel open={cartOpen} className="rr-cart-panel" close={() => setCartOpen(false)} title={`Your cart (${itemCount})`}><div className="rr-cart-items">{cart.length ? cart.map((item) => <div className="rr-cart-item" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{money(item.price)}</small><span><button onClick={() => updateQuantity(item.id, -1)}><Minus /></button>{item.quantity}<button onClick={() => updateQuantity(item.id, 1)}><Plus /></button></span></div></div>) : <p>Your cart is empty.</p>}</div><div className="rr-cart-total"><span>Subtotal <strong>{money(total)}</strong></span><button className="rr-button" disabled={!cart.length} onClick={() => { setCartOpen(false); setCheckout(true); setCheckoutStep(0); }}>Checkout</button></div></Panel>
      <Panel open={checkout} className="rr-checkout-panel" close={() => setCheckout(false)} title="Secure checkout">{checkoutStep < 3 ? <div className="rr-checkout"><div className="rr-checkout-main"><div className="rr-steps"><b className={checkoutStep === 0 ? "active" : ""}>01 Information</b><b className={checkoutStep === 1 ? "active" : ""}>02 Payment</b><b className={checkoutStep === 2 ? "active" : ""}>03 Review</b></div>{checkoutStep === 0 && <CheckoutForm title="Where should we send it?" submit={submitCheckout} fields={["Email", "First name", "Last name", "Address", "City", "Postal code"]} button="Continue to payment" />}{checkoutStep === 1 && <><CheckoutForm title="Payment details" submit={submitCheckout} fields={["Card number", "Expiry", "Security code", "Name on card"]} button="Review order" /><div className="rr-checkout-payment-methods"><span>Accepted payment methods</span><PaymentMethods compact /></div></>}{checkoutStep === 2 && <form onSubmit={(event) => { event.preventDefault(); setCheckoutStep(3); setCart([]); }}><h2>Ready to place your order</h2><p>This storefront prototype does not process a real payment.</p><button className="rr-button">Place order</button></form>}</div><aside><details><summary><span>Order summary</span><strong>{money(total)}</strong></summary><div><h3>Order summary</h3>{cart.map((item) => <p key={item.id}>{item.name} × {item.quantity}<strong>{money(item.price * item.quantity)}</strong></p>)}<hr /><p>Total <strong>{money(total)}</strong></p></div></details></aside></div> : <div className="rr-confirm"><span><Check /></span><h2>Thank you</h2><p>Your prototype order is confirmed.</p><button className="rr-button" onClick={() => setCheckout(false)}>Continue shopping</button></div>}</Panel>
      <button className={`rr-scroll-top ${showScrollTop ? "visible" : ""}`} onClick={() => lenisRef.current?.scrollTo(0, { duration: 1.1 })} aria-label="Scroll to top"><ArrowUp /></button>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) { return <div className="rr-section-head"><p className="rr-kicker">{kicker}</p><h2>{title}</h2></div>; }

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) { return <article className="rr-product">{product.oldPrice && <em>Sale</em>}<Link className="rr-product-image" href={`/products/${product.slug}`}><img src={product.image} alt={product.name} /></Link><div><Link href={`/products/${product.slug}`}><strong>{product.name}</strong><small>{product.category}</small></Link><span>{product.oldPrice && <s>{money(product.oldPrice)}</s>} {money(product.price)}</span><button className="rr-add" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}><Plus /></button></div></article>; }

function PaymentMethods({ compact = false }: { compact?: boolean }) {
  return <div className={`rr-payment-methods ${compact ? "is-compact" : ""}`} aria-label="Accepted payment methods">{paymentMethods.map((method) => <span className="rr-payment-mark" key={method.name} title={method.name}><img src={method.image} alt={method.name} /></span>)}<span className="rr-payment-mark rr-shop-pay" title="Shop Pay" aria-label="Shop Pay"><b>shop</b><i>Pay</i></span></div>;
}

function Panel({ open, close, title, className = "", children }: { open: boolean; close: () => void; title: string; className?: string; children: React.ReactNode }) { useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]); return <aside className={`rr-panel ${open ? "open" : ""} ${className}`} aria-hidden={!open} aria-modal="true" role="dialog" aria-label={title}><header><strong>{title}</strong><button onClick={close}>Close <X /></button></header><div className="rr-panel-scroll" data-lenis-prevent>{children}</div></aside>; }

function CheckoutForm({ title, fields, button, submit }: { title: string; fields: string[]; button: string; submit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={submit}><h2>{title}</h2><div className="rr-checkout-fields">{fields.map((field) => <label key={field}>{field}<input required type={field === "Email" ? "email" : "text"} /></label>)}</div><button className="rr-button">{button}</button></form>; }

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { element.classList.add("is-visible"); observer.disconnect(); }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`rr-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function LiquidReveal({ before, after }: { before: string; after: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const context = canvas.getContext("2d"), cover = document.createElement("canvas"), coverContext = cover.getContext("2d"), brush = document.createElement("canvas"), brushContext = brush.getContext("2d");
    if (!context || !coverContext || !brushContext) return;
    const image = new Image(); image.crossOrigin = "anonymous"; image.src = after;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let dpr = Math.min(devicePixelRatio, 2), radius = 143 * dpr, diameter = Math.ceil(radius * 2), idle = 121, animation = 0, touching = false, last: { x: number; y: number } | null = null;
    let points: { x: number; y: number }[] = [];
    const resize = () => {
      const rect = wrap.getBoundingClientRect(); dpr = Math.min(devicePixelRatio, 2); radius = (coarse ? Math.min(rect.width * .3, 132) : 143) * dpr; diameter = Math.ceil(radius * 2);
      canvas.width = cover.width = Math.round(rect.width * dpr); canvas.height = cover.height = Math.round(rect.height * dpr); canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`; brush.width = brush.height = diameter;
      coverContext.clearRect(0, 0, cover.width, cover.height);
      if (image.complete && image.naturalWidth) { const scale = Math.max(cover.width / image.naturalWidth, cover.height / image.naturalHeight), width = image.naturalWidth * scale, height = image.naturalHeight * scale; coverContext.drawImage(image, (cover.width - width) / 2, (cover.height - height) / 2, width, height); if (coarse) points.push({ x: canvas.width * .52, y: canvas.height * .62 }); }
    };
    image.onload = resize; const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(wrap); resize();
    const stamp = ({ x, y }: { x: number; y: number }) => {
      brushContext.clearRect(0, 0, diameter, diameter); brushContext.globalCompositeOperation = "source-over";
      const gradient = brushContext.createRadialGradient(radius, radius, 0, radius, radius, radius); gradient.addColorStop(0, "rgba(255,255,255,1)"); gradient.addColorStop(.55, "rgba(255,255,255,.82)"); gradient.addColorStop(1, "rgba(255,255,255,0)"); brushContext.fillStyle = gradient; brushContext.fillRect(0, 0, diameter, diameter);
      brushContext.globalCompositeOperation = "source-in"; brushContext.drawImage(cover, -x + radius, -y + radius); context.globalCompositeOperation = "source-over"; context.drawImage(brush, x - radius, y - radius);
    };
    const pointer = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect(), x = (event.clientX - rect.left) * dpr, y = (event.clientY - rect.top) * dpr;
      if (x < -radius || y < -radius || x > canvas.width + radius || y > canvas.height + radius) { last = null; return; }
      if (!last) points.push({ x, y }); else { const dx = x - last.x, dy = y - last.y, distance = Math.hypot(dx, dy), count = Math.min(Math.ceil(distance / Math.max(radius * .3, 1)), 60); for (let index = 1; index <= count; index++) points.push({ x: last.x + dx * index / count, y: last.y + dy * index / count }); }
      last = { x, y };
    };
    const tick = () => {
      const drawing = points.length > 0; idle = drawing ? 0 : idle + 1;
      if (idle <= 120) { context.globalCompositeOperation = "destination-out"; context.fillStyle = `rgba(0,0,0,${drawing ? .016 : Math.min(.016 + idle * .004, .5)})`; context.fillRect(0, 0, canvas.width, canvas.height); if (drawing) { points.forEach(stamp); points = []; } else if (idle === 120) context.clearRect(0, 0, canvas.width, canvas.height); }
      animation = requestAnimationFrame(tick);
    };
    const down = (event: PointerEvent) => { if (!coarse) return; touching = true; last = null; wrap.setPointerCapture?.(event.pointerId); pointer(event); wrap.classList.add("is-touching"); };
    const move = (event: PointerEvent) => { if (!coarse || touching) pointer(event); };
    const up = (event: PointerEvent) => { if (!coarse) return; touching = false; last = null; wrap.releasePointerCapture?.(event.pointerId); wrap.classList.remove("is-touching"); };
    window.addEventListener("pointermove", move, { passive: true }); wrap.addEventListener("pointerdown", down); wrap.addEventListener("pointerup", up); wrap.addEventListener("pointercancel", up); animation = requestAnimationFrame(tick);
    return () => { resizeObserver.disconnect(); window.removeEventListener("pointermove", move); wrap.removeEventListener("pointerdown", down); wrap.removeEventListener("pointerup", up); wrap.removeEventListener("pointercancel", up); cancelAnimationFrame(animation); };
  }, [after]);

  return <div className="rr-liquid" ref={wrapRef}><img src={before} alt="A room before styling" /><canvas ref={canvasRef} aria-label="Touch and move across the hero to reveal a second styled room" /></div>;
}

function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [values, setValues] = useState([0, 0, 0, 0]);
  useEffect(() => {
    let last = 0;
    const update = () => {
      if (performance.now() - last < 30 || !ref.current) return;
      last = performance.now(); const rect = ref.current.getBoundingClientRect(), start = innerHeight, end = innerHeight / 2 - rect.height / 2, progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      const targets = [PRODUCTS.length, new Set(PRODUCTS.map((product) => product.category)).size, Math.max(...PRODUCTS.map((product) => product.sizes.length)), PRODUCTS.filter((product) => product.oldPrice).length];
      setValues(targets.map((target) => Math.round(progress * target)));
    };
    update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update);
  }, []);
  const stats = [[values[0], "", "Curated rug designs"], [values[1], "", "Shop-ready collections"], [values[2], "", "Sizes per design"], [values[3], "", "Current sale picks"]] as const;
  return <section ref={ref} className="rr-stats"><Reveal><div className="rr-stats-panel"><p className="rr-kicker">By the numbers</p><h2>Proof in the details, quality in every piece</h2><ul>{stats.map(([value, suffix, label], index) => <li key={label} style={{ transitionDelay: `${index * 90}ms` }}><strong>{value}{suffix}</strong><span>{label}</span></li>)}</ul></div></Reveal></section>;
}
