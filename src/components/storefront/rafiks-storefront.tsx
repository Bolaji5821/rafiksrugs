"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ArrowUpRight, Check, ChevronDown, Menu, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import Lenis from "lenis";
import Link from "next/link";
import NextImage from "next/image";
import { money, PRODUCTS, type Product } from "@/lib/catalog";
import "./storefront.css";

type CartItem = Product & { quantity: number };

const categories = [
  { name: "Area rugs", image: PRODUCTS[0].image, count: 2 },
  { name: "Runners", image: PRODUCTS[3].image, count: 2 },
  { name: "Shag", image: PRODUCTS[4].image, count: 2 },
  { name: "Vintage", image: PRODUCTS[2].image, count: 2 },
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
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    const lenis = new Lenis({ smoothWheel: true, anchors: true }); lenisRef.current = lenis;
    let frame = 0; const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); }; frame = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(frame); lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    const locked = !loaded || menuOpen || searchOpen || cartOpen || Boolean(selected) || checkout;
    document.documentElement.classList.toggle("rr-locked", locked);
    if (locked) lenisRef.current?.stop(); else lenisRef.current?.start();
    return () => document.documentElement.classList.remove("rr-locked");
  }, [loaded, menuOpen, searchOpen, cartOpen, selected, checkout]);

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
    const update = () => setShowScrollTop(window.scrollY > window.innerHeight * 0.75);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
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
    setSelected(null);
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
    const request = Object.fromEntries(form.entries());
    const existing = JSON.parse(localStorage.getItem("rafiks-rug-requests") || "[]");
    localStorage.setItem("rafiks-rug-requests", JSON.stringify([...existing, { ...request, createdAt: new Date().toISOString() }]));
    event.currentTarget.reset();
    setRequestSent(true);
  };

  const submitCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckoutStep((step) => step + 1);
  };

  const closeAll = () => { setMenuOpen(false); setSearchOpen(false); setCartOpen(false); setSelected(null); setCheckout(false); };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeAll();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`rr-site ${loaded ? "rr-ready" : ""}`}>
      <a className="rr-skip" href="#main">Skip to content</a>
      <div className={`rr-loader ${loaded ? "is-loaded" : ""}`}><div className="rr-loader-center"><span className="rr-loader-logo"><NextImage src="/RafiksRugs.png" alt="Rafik's Rugs" width={300} height={300} priority /></span><p>Handwoven character, sourced with quiet care.</p></div><div className="rr-loader-progress"><i><span style={{ width: `${progress}%` }} /></i><div><span>Loading</span><b>{String(progress).padStart(3, "0")}</b></div></div></div>
      <header className="rr-header rr-ready-reveal">
        <div className="rr-announcement">Free shipping on orders over $100 · Easy returns within 30 days</div>
        <nav className="rr-nav" aria-label="Primary navigation">
          <button onClick={() => setMenuOpen(true)}><Menu size={18} /><span>Menu</span></button>
          <a className="rr-logo" href="#home" aria-label="Rafik's Rugs home"><span><NextImage src="/RafiksRugs.png" alt="" width={300} height={300} priority /></span></a>
          <div className="rr-nav-actions"><button onClick={() => setSearchOpen(true)}><Search size={18} /><span>Search</span></button><button onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>Cart</span><i>{itemCount}</i></button></div>
        </nav>
      </header>

      <main id="main">
        <section className="rr-hero" id="home">
          <LiquidReveal before={PRODUCTS[0].image} after="https://rafiksrugs.com/cdn/shop/files/886cb141-260a-4066-8183-69b775c7d0d7_jpg.webp?v=1784073571&width=1100" />
          <div className="rr-hero-vignette" /><div className="rr-hero-watermark">RAFIK&apos;S</div>
          <div className="rr-hero-copy"><p className="rr-kicker rr-hero-enter rr-delay-1">Made for homes with soul</p><h1><span><i>Browse our</i></span><span><i>latest products</i></span></h1><button className="rr-pill rr-light rr-hero-enter rr-delay-4" onClick={() => lenisRef.current?.scrollTo("#collection", { duration: 1.1 })}>Shop all <ArrowUpRight /></button></div>
          <div className="rr-feature-card rr-hero-enter rr-delay-3"><img src={PRODUCTS[featureIndex].image} alt={PRODUCTS[featureIndex].name} /><div><span>{PRODUCTS[featureIndex].name}<small>{money(PRODUCTS[featureIndex].price)}</small></span><b>{String(featureIndex + 1).padStart(2, "0")} / 08</b></div><div className="rr-feature-dots">{PRODUCTS.map((product, index) => <button key={product.id} className={index === featureIndex ? "active" : ""} onClick={() => setFeatureIndex(index)} aria-label={`Show ${product.name}`} />)}</div></div>
        </section>

        <section className="rr-section rr-categories" id="categories"><Reveal><SectionHeading kicker="Find your foundation" title="Shop by category" /></Reveal><div className="rr-category-grid">{categories.map((category, index) => <Reveal key={category.name} delay={index * 120}><button className="rr-category" onClick={() => shopCategory(category.name)}><img src={category.image} alt={`${category.name} collection`} /><span><strong>{category.name}</strong><small>{category.count} pieces <ArrowUpRight /></small></span></button></Reveal>)}</div></section>

        <section className="rr-create-band" aria-label="Our approach">{["We", "Source", "→", "Better"].map((word, index) => <Reveal key={word} delay={index * 120}><span className={`rr-create-${index + 1}`}>{word}</span></Reveal>)}</section>

        <section className="rr-spotlight" id="spotlight"><Reveal className="rr-spot-image"><img src={PRODUCTS[0].image} alt="Glam White and Gold Rug in a warm living room" /></Reveal><Reveal className="rr-spot-copy" delay={120}><p className="rr-kicker">Product spotlight / 01</p><h2>Glam White &amp; Gold Rug</h2><p className="rr-price">{money(129.99)}</p><p>Soft underfoot, carefully finished, and designed to bring luminous warmth to everyday rooms.</p><button className="rr-button" onClick={() => addToCart(PRODUCTS[0])}>Add to cart</button><button className="rr-button rr-terra" onClick={() => { addToCart(PRODUCTS[0], false); setCheckout(true); }}>Buy now</button></Reveal></section>

        <section className="rr-section rr-collection" id="collection"><Reveal><SectionHeading kicker="Collection / 2026" title="Find your rug" /></Reveal><div className="rr-tools"><div className="rr-filters">{["All", "Area rugs", "Runners", "Shag", "Vintage", "Sale"].map((name) => <button key={name} className={filter === name ? "active" : ""} onClick={() => setFilter(name)}>{name}</button>)}</div><label>Sort <ChevronDown size={14} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price low to high</option><option value="high">Price high to low</option><option value="name">Name A to Z</option></select></label></div><div className="rr-products">{catalog.map((product, index) => <Reveal key={product.id} delay={index * 90}><ProductCard product={product} onView={setSelected} onAdd={addToCart} /></Reveal>)}</div></section>

        <Stats />

        <section className="rr-request" id="request"><Reveal><div><p className="rr-kicker">Can&apos;t find it?</p><h2>Tell us what your room needs.</h2><p>Share size, style, colors, and budget. Our sourcing team will review your request and follow up with available options.</p></div></Reveal><Reveal delay={120}>{requestSent ? <div className="rr-request-success"><Check /><h3>Request received</h3><p>We saved your request on this device for this storefront prototype.</p><button onClick={() => setRequestSent(false)}>Send another request</button></div> : <form onSubmit={submitRequest}><label>Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label><label>Rug type<select name="type" required defaultValue=""><option value="" disabled>Select a type</option><option>Area rug</option><option>Runner</option><option>Shag</option><option>Vintage</option><option>Custom</option></select></label><label>Preferred size<input name="size" placeholder="e.g. 8 × 10 ft" required /></label><label>Budget<input name="budget" placeholder="e.g. $150–$300" required /></label><label className="wide">Describe your ideal rug<textarea name="description" rows={4} placeholder="Colors, material, pattern, room, or reference details" required /></label><button className="rr-button wide">Request this rug <ArrowUpRight /></button></form>}</Reveal></section>

        <section className="rr-story"><Reveal><p className="rr-kicker">Our story / Our craft</p></Reveal><Reveal delay={120}><h2>Talk about your brand</h2></Reveal></section>
        <section className="rr-newsletter"><Reveal><h2>Subscribe to our emails</h2></Reveal><Reveal delay={120}><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Email address" required /><button>Subscribe <ArrowUpRight /></button></form></Reveal></section>
      </main>

      <footer className="rr-footer"><Reveal><div className="rr-footer-logo"><NextImage src="/RafiksRugs.png" alt="Rafik's Rugs" width={900} height={900} /></div></Reveal><div className="rr-footer-grid"><div><small>Explore</small><Link href="/collections">Shop all</Link><a href="#request">Request a rug</a><Link href="/search">Search</Link></div><div><small>Customer care</small><Link href="/shipping-returns">Shipping &amp; returns</Link><Link href="/shipping-returns#care">Rug care</Link></div><div><small>Payment methods</small><span>VISA · MC · AMEX · SHOP</span></div></div><p>© 2026 Rafik&apos;s Rugs · Privacy · Terms · Shipping policy</p></footer>

      <Panel open={menuOpen} className="rr-menu-panel" close={() => setMenuOpen(false)} title="Menu"><nav>{[["Home", "home"], ["Categories", "categories"], ["Shop all", "collection"], ["Request a rug", "request"]].map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}<button onClick={() => { setMenuOpen(false); setSearchOpen(true); }}>Search</button></nav></Panel>
      <Panel open={searchOpen} close={() => setSearchOpen(false)} title="Search"><div className="rr-search"><label><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rugs" /></label><div className="rr-search-results">{searchResults.map((product) => <ProductCard key={product.id} product={product} onView={(item) => { setSearchOpen(false); setSelected(item); }} onAdd={addToCart} />)}</div></div></Panel>
      <Panel open={cartOpen} className="rr-cart-panel" close={() => setCartOpen(false)} title={`Your cart (${itemCount})`}><div className="rr-cart-items">{cart.length ? cart.map((item) => <div className="rr-cart-item" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{money(item.price)}</small><span><button onClick={() => updateQuantity(item.id, -1)}><Minus /></button>{item.quantity}<button onClick={() => updateQuantity(item.id, 1)}><Plus /></button></span></div></div>) : <p>Your cart is empty.</p>}</div><div className="rr-cart-total"><span>Subtotal <strong>{money(total)}</strong></span><button className="rr-button" disabled={!cart.length} onClick={() => { setCartOpen(false); setCheckout(true); setCheckoutStep(0); }}>Checkout</button></div></Panel>
      <Panel open={Boolean(selected)} close={() => setSelected(null)} title="Product details">{selected && <div className="rr-detail"><img src={selected.image} alt={selected.name} /><div><p className="rr-kicker">{selected.category}</p><h2>{selected.name}</h2><p className="rr-price">{money(selected.price)}</p><p>Soft, durable, and selected to ground your room with warmth and character.</p><label>Size<select><option>5 × 7 ft</option><option>6 × 9 ft</option><option>8 × 10 ft</option></select></label><button className="rr-button" onClick={() => addToCart(selected)}>Add to cart</button></div></div>}</Panel>
      <Panel open={checkout} close={() => setCheckout(false)} title="Secure checkout">{checkoutStep < 3 ? <div className="rr-checkout"><div className="rr-checkout-main"><div className="rr-steps"><b className={checkoutStep === 0 ? "active" : ""}>01 Information</b><b className={checkoutStep === 1 ? "active" : ""}>02 Payment</b><b className={checkoutStep === 2 ? "active" : ""}>03 Review</b></div>{checkoutStep === 0 && <CheckoutForm title="Where should we send it?" submit={submitCheckout} fields={["Email", "First name", "Last name", "Address", "City", "Postal code"]} button="Continue to payment" />}{checkoutStep === 1 && <CheckoutForm title="Payment details" submit={submitCheckout} fields={["Card number", "Expiry", "Security code", "Name on card"]} button="Review order" />}{checkoutStep === 2 && <form onSubmit={(event) => { event.preventDefault(); setCheckoutStep(3); setCart([]); }}><h2>Ready to place your order</h2><p>This storefront prototype does not process a real payment.</p><button className="rr-button">Place order</button></form>}</div><aside><h3>Order summary</h3>{cart.map((item) => <p key={item.id}>{item.name} × {item.quantity}<strong>{money(item.price * item.quantity)}</strong></p>)}<hr /><p>Total <strong>{money(total)}</strong></p></aside></div> : <div className="rr-confirm"><span><Check /></span><h2>Thank you</h2><p>Your prototype order is confirmed.</p><button className="rr-button" onClick={() => setCheckout(false)}>Continue shopping</button></div>}</Panel>
      <button className={`rr-scroll-top ${showScrollTop ? "visible" : ""}`} onClick={() => lenisRef.current?.scrollTo(0, { duration: 1.1 })} aria-label="Scroll to top"><ArrowUp /></button>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) { return <div className="rr-section-head"><p className="rr-kicker">{kicker}</p><h2>{title}</h2></div>; }

function ProductCard({ product, onView, onAdd }: { product: Product; onView: (product: Product) => void; onAdd: (product: Product) => void }) { return <article className="rr-product">{product.oldPrice && <em>Sale</em>}<button className="rr-product-image" onClick={() => onView(product)}><img src={product.image} alt={product.name} /></button><div><button onClick={() => onView(product)}><strong>{product.name}</strong><small>{product.category}</small></button><span>{product.oldPrice && <s>{money(product.oldPrice)}</s>} {money(product.price)}</span><button className="rr-add" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}><Plus /></button></div></article>; }

function Panel({ open, close, title, className = "", children }: { open: boolean; close: () => void; title: string; className?: string; children: React.ReactNode }) { useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]); return <aside className={`rr-panel ${open ? "open" : ""} ${className}`} aria-hidden={!open} aria-modal="true" role="dialog" aria-label={title}><header><strong>{title}</strong><button onClick={close}>Close <X /></button></header>{children}</aside>; }

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
    let dpr = Math.min(devicePixelRatio, 2), radius = 143 * dpr, diameter = Math.ceil(radius * 2), idle = 121, animation = 0, last: { x: number; y: number } | null = null;
    let points: { x: number; y: number }[] = [];
    const resize = () => {
      const rect = wrap.getBoundingClientRect(); dpr = Math.min(devicePixelRatio, 2); radius = 143 * dpr; diameter = Math.ceil(radius * 2);
      canvas.width = cover.width = Math.round(rect.width * dpr); canvas.height = cover.height = Math.round(rect.height * dpr); canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`; brush.width = brush.height = diameter;
      coverContext.clearRect(0, 0, cover.width, cover.height);
      if (image.complete && image.naturalWidth) { const scale = Math.max(cover.width / image.naturalWidth, cover.height / image.naturalHeight), width = image.naturalWidth * scale, height = image.naturalHeight * scale; coverContext.drawImage(image, (cover.width - width) / 2, (cover.height - height) / 2, width, height); }
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
    window.addEventListener("pointermove", pointer, { passive: true }); animation = requestAnimationFrame(tick);
    return () => { resizeObserver.disconnect(); window.removeEventListener("pointermove", pointer); cancelAnimationFrame(animation); };
  }, [after]);

  return <div className="rr-liquid" ref={wrapRef}><img src={before} alt="A styled room featuring a handwoven rug" /><canvas ref={canvasRef} aria-hidden="true" /></div>;
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
  return <section ref={ref} className="rr-stats"><Reveal><div className="rr-stats-panel"><p className="rr-kicker">By the numbers</p><h2>Proof in the details, not the noise.</h2><ul>{stats.map(([value, suffix, label], index) => <li key={label} style={{ transitionDelay: `${index * 90}ms` }}><strong>{value}{suffix}</strong><span>{label}</span></li>)}</ul></div></Reveal></section>;
}
