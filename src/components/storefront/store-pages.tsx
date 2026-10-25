"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  Minus,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react";
import { money, type Product } from "@/lib/catalog";
import "./store-pages.css";

export function StoreChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-page">
      <header className="store-header">
        <Link
          className="store-brand-logo"
          href="/"
          aria-label="Rafik's Rugs home"
        >
          <Image
            src="/RafiksRugs.png"
            alt=""
            width={300}
            height={300}
            priority
          />
        </Link>
        <nav>
          <Link href="/collections">Shop</Link>
          <Link href="/search">
            <Search /> Search
          </Link>
          <Link href="/#request">Request a rug</Link>
          <Link href="/">
            <ShoppingBag /> Cart
          </Link>
        </nav>
      </header>
      {children}
      <footer className="store-footer">
        <strong className="store-footer-logo">
          <Image
            src="/RafiksRugs.png"
            alt="Rafik's Rugs"
            width={900}
            height={900}
          />
        </strong>
        <div>
          <span>Handwoven character for rooms with soul.</span>
          <nav>
            <Link href="/collections">Shop all</Link>
            <Link href="/#request">Request a rug</Link>
            <Link href="/search">Search</Link>
            <Link href="/shipping-returns">Shipping &amp; returns</Link>
          </nav>
        </div>
        <small>© 2026 Rafik&apos;s Rugs · Privacy · Terms</small>
      </footer>
      <RouteScrollTop />
    </div>
  );
}

function RouteScrollTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(scrollY > innerHeight * 0.75);
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);
  return (
    <button
      className={`store-scroll-top ${visible ? "visible" : ""}`}
      onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
    >
      <ArrowUp />
    </button>
  );
}

function LoadFailedNotice() {
  return (
    <p className="store-empty" role="alert">
      We couldn&apos;t load the rugs right now. Please try again in a moment.
    </p>
  );
}

export function CollectionView({
  products,
  loadFailed = false,
  title = "All rugs",
  description = "Explore every texture, tone, and shape in the collection.",
}: {
  products: Product[];
  loadFailed?: boolean;
  title?: string;
  description?: string;
}) {
  const [sort, setSort] = useState("featured");
  const sorted = useMemo(
    () =>
      [...products].sort((a, b) =>
        sort === "low"
          ? a.price - b.price
          : sort === "high"
            ? b.price - a.price
            : sort === "name"
              ? a.name.localeCompare(b.name)
              : b.id - a.id,
      ),
    [products, sort],
  );
  return (
    <StoreChrome>
      <main>
        <section className="store-hero">
          <Link href="/">
            <ArrowLeft /> Home
          </Link>
          <p>Collection</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </section>
        <section className="store-catalog">
          <div className="store-catalog-tools">
            <span>{sorted.length} products</span>
            <label>
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="featured">Newest first</option>
                <option value="low">Price low to high</option>
                <option value="high">Price high to low</option>
                <option value="name">Name A to Z</option>
              </select>
            </label>
          </div>
          {loadFailed ? (
            <LoadFailedNotice />
          ) : sorted.length === 0 ? (
            <p className="store-empty">
              No rugs here yet. Please check back soon.
            </p>
          ) : (
            <div className="store-grid">
              {sorted.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
        <TrustBand />
      </main>
    </StoreChrome>
  );
}

export function StoreProductCard({ product }: { product: Product }) {
  return (
    <article className="store-product">
      {product.availability && product.availability !== "in_stock" ? (
        <em>
          {product.availability === "sold_out" ? "Sold out" : "Unavailable"}
        </em>
      ) : (
        product.oldPrice && <em>Sale</em>
      )}
      <Link href={`/products/${product.slug}`}>
        <img src={product.image} alt={product.name} />
        <div>
          <p>{product.category}</p>
          <h2>{product.name}</h2>
          <span>
            {product.oldPrice && <s>{money(product.oldPrice)}</s>}{" "}
            {money(product.price)}
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ProductPurchase({ product }: { product: Product }) {
  const [size, setSize] = useState<string | undefined>(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Sample products have no availability and can always be bought
  const canBuy =
    product.availability === undefined || product.availability === "in_stock";
  const add = () => {
    if (!canBuy) return;
    const stored = JSON.parse(localStorage.getItem("rafiks-cart") || "[]");
    const found = stored.find(
      (item: { id: number; size?: string }) =>
        item.id === product.id && item.size === size,
    );
    const next = found
      ? stored.map((item: { id: number; size?: string; quantity: number }) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...stored, { ...product, size, quantity }];
    localStorage.setItem("rafiks-cart", JSON.stringify(next));
    setAdded(true);
  };
  return (
    <div className="store-buy">
      {product.sizes.length > 0 && (
        <label>
          Size
          <select
            value={size}
            onChange={(event) => setSize(event.target.value)}
          >
            {product.sizes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        Quantity
        <span className="store-quantity">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
          >
            <Minus />
          </button>
          {quantity}
          <button
            onClick={() => setQuantity(quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus />
          </button>
        </span>
      </label>
      <button className="store-primary" onClick={add} disabled={!canBuy}>
        {!canBuy ? (
          product.availability === "sold_out" ? (
            "Sold out"
          ) : (
            "Currently unavailable"
          )
        ) : added ? (
          <>
            <Check /> Added to cart
          </>
        ) : (
          "Add to cart"
        )}
      </button>
      <p>Free shipping over $100 · Easy returns within 30 days</p>
    </div>
  );
}

export function SearchView({
  products,
  loadFailed = false,
}: {
  products: Product[];
  loadFailed?: boolean;
}) {
  const [query, setQuery] = useState("");
  // Every word typed must appear somewhere in the rug, so "wool runner" finds wool rugs that are runners
  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length
      ? products.filter((product) => {
          const text =
            `${product.name} ${product.category} ${product.style} ${product.material} ${product.origin} ${product.description} ${product.sizes.join(" ")}`.toLowerCase();
          return words.every((word) => text.includes(word));
        })
      : products;
  }, [query, products]);
  return (
    <StoreChrome>
      <main>
        <section className="store-search">
          <p>Search the collection</p>
          <label>
            <Search />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try ‘runner’, ‘wool’, or ‘vintage’"
            />
          </label>
          <span>{results.length} results</span>
        </section>
        <section className="store-catalog">
          {loadFailed ? (
            <LoadFailedNotice />
          ) : results.length === 0 ? (
            <p className="store-empty">No rugs match your search.</p>
          ) : (
            <div className="store-grid">
              {results.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </StoreChrome>
  );
}

export function NewsletterBand() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };
  return (
    <section className="store-news">
      <div>
        <p>New rugs, thoughtfully selected</p>
        <h2>Join the rug notes.</h2>
      </div>
      <form onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="Email address"
          aria-label="Email address"
        />
        <button>
          {sent ? (
            "Subscribed"
          ) : (
            <>
              Subscribe <ArrowUpRight />
            </>
          )}
        </button>
      </form>
    </section>
  );
}

export function TrustBand() {
  return (
    <>
      <section className="store-trust">
        <div>
          <strong>30-day returns</strong>
          <span>Time to see it in your room.</span>
        </div>
        <div>
          <strong>Secure checkout</strong>
          <span>Protected payment experience.</span>
        </div>
        <div>
          <strong>Care guidance</strong>
          <span>Practical support for every rug.</span>
        </div>
        <div>
          <strong>Thoughtful sourcing</strong>
          <span>Selected for character and quality.</span>
        </div>
      </section>
      <NewsletterBand />
    </>
  );
}
