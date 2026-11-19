"use client";

/* eslint-disable @next/next/no-img-element */
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import NextImage from "next/image";
import { PRODUCTS as SAMPLE_PRODUCTS, type Product } from "@/lib/catalog";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import {
  CurrencyProvider,
  useMoney,
} from "@/components/storefront/currency-context";
import {
  ConversionNote,
  CurrencySwitcher,
} from "@/components/storefront/currency-switcher";
import { FREE_SHIPPING_OVER, orderTotals } from "@/lib/shipping";
import { useStoreSettings } from "@/lib/use-store-settings";
import { submitCustomRequest } from "@/lib/api";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { useNewsletter } from "@/lib/use-newsletter";
import {
  PaymentBadges,
  PaymentMethodPicker,
  SizePicker,
  SocialLinks,
  WishlistButton,
  WishlistLink,
  paymentLabel,
  type PaymentMethodId,
} from "@/components/storefront/extras";
import "./storefront.css";
import "./storefront-redesign.css";

// The home page shows the newest rugs; everything else is on /collections
const HOME_PRODUCT_LIMIT = 8;

const MAX_PHOTOS = 3;
const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Lets a customer attach up to 3 photos to the "Request a rug" form.
// Only the sourcing team can see them.
function PhotoPicker({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [message, setMessage] = useState("");
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(
    () => () => urls.forEach((url) => URL.revokeObjectURL(url)),
    [urls],
  );

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    let problem = "";
    for (const file of Array.from(list)) {
      if (!PHOTO_TYPES.includes(file.type)) {
        problem = `${file.name} is not a JPG, PNG or WebP photo.`;
        continue;
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        problem = `${file.name} is larger than ${MAX_PHOTO_MB} MB.`;
        continue;
      }
      if (next.length >= MAX_PHOTOS) {
        problem = `You can add up to ${MAX_PHOTOS} photos.`;
        break;
      }
      next.push(file);
    }
    setMessage(problem);
    onChange(next);
  };

  return (
    <div className="wide" style={{ display: "grid", gap: ".6rem" }}>
      <span>Photos of what you have in mind (optional)</span>
      <small>
        Up to {MAX_PHOTOS} photos, JPG, PNG or WebP, {MAX_PHOTO_MB} MB each.
        Only our team sees them.
      </small>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={files.length >= MAX_PHOTOS}
        aria-label="Add photos"
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />
      {message && (
        <p role="alert" style={{ margin: 0, fontSize: 14 }}>
          {message}
        </p>
      )}
      {files.length > 0 && (
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              style={{ position: "relative", width: 88, height: 88 }}
            >
              <img
                src={urls[index]}
                alt={`Photo ${index + 1}: ${file.name}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => {
                  setMessage("");
                  onChange(files.filter((_, i) => i !== index));
                }}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "1px solid #999",
                  background: "#fff",
                  color: "#111",
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeNewsletterForm() {
  const { status, error, submit } = useNewsletter();
  return (
    <form onSubmit={submit}>
      <input
        name="email"
        type="email"
        placeholder="Email address"
        maxLength={255}
        required
      />
      <button disabled={status === "sending"}>
        {status === "done" ? (
          "Subscribed"
        ) : status === "sending" ? (
          "Subscribing…"
        ) : (
          <>
            Subscribe <ArrowUpRight />
          </>
        )}
      </button>
      {error && (
        <p role="alert" style={{ flexBasis: "100%", margin: 0, fontSize: 14 }}>
          {error}
        </p>
      )}
    </form>
  );
}

type CartItem = Product & { quantity: number; size?: string };

// A rug can be bought unless the owner marked it sold out or unavailable
const canBuy = (product: Product) =>
  product.availability !== "sold_out" && product.availability !== "unavailable";

export function RafiksStorefront({
  products,
  loadFailed = false,
  currency = DEFAULT_CURRENCY,
}: {
  products: Product[];
  loadFailed?: boolean;
  currency?: string;
}) {
  // The provider sits outside, so everything inside can show prices in the visitor's currency
  return (
    <CurrencyProvider currency={currency}>
      <StorefrontContent products={products} loadFailed={loadFailed} />
    </CurrencyProvider>
  );
}

function StorefrontContent({
  products,
  loadFailed,
}: {
  products: Product[];
  loadFailed: boolean;
}) {
  const money = useMoney();
  const storeSettings = useStoreSettings(); // shipping and tax from the admin Settings page
  const lenisRef = useRef<Lenis | null>(null);
  const cartReady = useRef(false);
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
  const [details, setDetails] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState<PaymentMethodId>("card");
  const setDetail = (key: string, value: string) =>
    setDetails((current) => ({ ...current, [key]: value }));
  const [selectedSize, setSelectedSize] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestPhotos, setRequestPhotos] = useState<File[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const categorySectionRef = useRef<HTMLElement>(null);
  const categoryStickyRef = useRef<HTMLDivElement>(null);
  const categoryViewportRef = useRef<HTMLDivElement>(null);
  const categoryTrackRef = useRef<HTMLDivElement>(null);

  // Categories come from the real products: name, a cover image and how many rugs
  const categories = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; image: string; count: number }
    >();
    products.forEach((product) => {
      const group = groups.get(product.category);
      if (group) group.count += 1;
      else
        groups.set(product.category, {
          name: product.category,
          image: product.image,
          count: 1,
        });
    });
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const featured = products.length
    ? products[featureIndex % products.length]
    : null;
  const spotlight = products.find(canBuy) ?? null;
  const filters = [
    "All",
    ...categories.map((category) => category.name),
    ...(products.some((product) => product.oldPrice) ? ["Sale"] : []),
    ...(products.some((product) => product.newArrival) ? ["New"] : []),
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    const started = performance.now();
    // Return visits in the same session get a short loader
    let seen = false;
    try {
      seen = sessionStorage.getItem("rr-seen") === "1";
    } catch {
      /* private mode: show the full loader */
    }
    const duration = seen ? 350 : 1300;
    let frame = 0;
    const ease = (value: number) =>
      value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
    const tick = (now: number) => {
      const next = Math.round(
        ease(Math.min((now - started) / duration, 1)) * 100,
      );
      setProgress(next);
      if (next < 100) frame = requestAnimationFrame(tick);
      else {
        try {
          sessionStorage.setItem("rr-seen", "1");
        } catch {
          /* private mode */
        }
        window.setTimeout(() => setLoaded(true), seen ? 80 : 260);
      }
    };
    frame = requestAnimationFrame(tick);
    const cartTimer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("rafiks-cart") || "[]");
        setCart(Array.isArray(stored) ? stored : []);
      } catch {
        setCart([]);
      }
      // Only start saving once the stored cart has been read (see the save effect below)
      cartReady.current = true;
      // The store pages link here with ?cart=1 to open the cart
      if (new URLSearchParams(window.location.search).get("cart") === "1") {
        setCartOpen(true);
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.hash,
        );
      }
    }, 0);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(cartTimer);
    };
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, anchors: true });
    lenisRef.current = lenis;
    gsap.registerPlugin(ScrollTrigger);
    const updateScrollTrigger = () => ScrollTrigger.update();
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.off("scroll", updateScrollTrigger);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const locked =
      !loaded ||
      menuOpen ||
      searchOpen ||
      cartOpen ||
      Boolean(selected) ||
      checkout;
    document.documentElement.classList.toggle("rr-locked", locked);
    if (locked) lenisRef.current?.stop();
    else lenisRef.current?.start();
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
    return () => {
      window.removeEventListener("resize", applyGrid);
      document.documentElement.style.removeProperty("font-size");
    };
  }, []);

  useEffect(() => {
    if (products.length < 2) return;
    const interval = window.setInterval(
      () => setFeatureIndex((index) => (index + 1) % products.length),
      3500,
    );
    return () => window.clearInterval(interval);
  }, [products.length]);

  useEffect(() => {
    const update = () => {
      setShowScrollTop(window.scrollY > window.innerHeight * 0.75);
      setHeaderScrolled(window.scrollY > 24);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!cartReady.current) return;
    localStorage.setItem("rafiks-cart", JSON.stringify(cart));
  }, [cart]);

  const catalog = useMemo(() => {
    const list = products.filter(
      (product) =>
        filter === "All" ||
        product.category === filter ||
        (filter === "Sale" && product.oldPrice) ||
        (filter === "New" && product.newArrival),
    );
    return [...list].sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : 0,
    );
  }, [products, filter, sort]);

  const visibleCatalog = catalog.slice(0, HOME_PRODUCT_LIMIT);

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value
      ? products.filter((product) =>
          `${product.name} ${product.category}`.toLowerCase().includes(value),
        )
      : products.slice(0, 4);
  }, [products, query]);

  const activeSize = selected?.sizes.includes(selectedSize)
    ? selectedSize
    : selected?.sizes[0];
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = orderTotals(
    total,
    storeSettings.shippingRate,
    storeSettings.taxRate,
  );

  const sameLine = (item: CartItem, id: number, size?: string) =>
    item.id === id && (item.size ?? "") === (size ?? "");

  const addToCart = (product: Product, open = true, size?: string) => {
    if (!canBuy(product)) return;
    setCart((items) => {
      const existing = items.find((item) => sameLine(item, product.id, size));
      return existing
        ? items.map((item) =>
            sameLine(item, product.id, size)
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...items, { ...product, size, quantity: 1 }];
    });
    setSelected(null);
    if (open) setCartOpen(true);
  };

  const updateQuantity = (id: number, change: number, size?: string) =>
    setCart((items) =>
      items
        .map((item) =>
          sameLine(item, id, size)
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );

  const shopCategory = (name: string) => {
    setFilter(name);
    lenisRef.current?.scrollTo("#collection", { duration: 1.1 });
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const text = (key: string) => String(form.get(key) ?? "").trim();

    setRequestSending(true);
    setRequestError("");
    try {
      await submitCustomRequest({
        name: text("name"),
        email: text("email"),
        rugType: text("type"),
        size: text("size"),
        budget: text("budget"),
        material: text("material") || undefined,
        description: text("description"),
        photos: requestPhotos,
      });
      formElement.reset();
      setRequestPhotos([]);
      setRequestSent(true);
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setRequestSending(false);
    }
  };

  const submitCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckoutStep((step) => step + 1);
  };

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setSelected(null);
    setCheckout(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && closeAll();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`rr-site ${loaded ? "rr-ready" : ""}`}>
      <a className="rr-skip" href="#main">
        Skip to content
      </a>
      <div className={`rr-loader ${loaded ? "is-loaded" : ""}`}>
        <div className="rr-loader-center">
          <span className="rr-loader-logo">
            <NextImage
              src="/RafiksRugsLight.png"
              alt="Rafik's Rugs"
              width={300}
              height={300}
              loading="eager"
            />
          </span>
          <p>Handwoven character, sourced with quiet care.</p>
        </div>
        <div className="rr-loader-progress">
          <i>
            <span style={{ width: `${progress}%` }} />
          </i>
          <div>
            <span>Loading</span>
            <b>{String(progress).padStart(3, "0")}</b>
          </div>
        </div>
      </div>
      <header
        className={`rr-header rr-ready-reveal ${headerScrolled ? "is-scrolled" : ""}`}
      >
        <div className="rr-announcement">
          Free shipping on orders over {money(FREE_SHIPPING_OVER)} · Easy
          returns within 30 days
        </div>
        <nav className="rr-nav" aria-label="Primary navigation">
          <button onClick={() => setMenuOpen(true)}>
            <Menu size={18} />
            <span>Menu</span>
          </button>
          <a className="rr-logo" href="#home" aria-label="Rafik's Rugs home">
            <span>
              <NextImage
                src="/RafiksRugsLight.png"
                alt=""
                width={300}
                height={300}
                loading="eager"
              />
            </span>
          </a>
          <div className="rr-nav-actions">
            <CurrencySwitcher />
            <button onClick={() => setSearchOpen(true)}>
              <Search size={18} />
              <span>Search</span>
            </button>
            <WishlistLink />
            <button
              className="rr-cart-trigger"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            >
              <ShoppingBag size={20} />
              <i>{itemCount}</i>
            </button>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="rr-hero" id="home">
          <LiquidReveal
            before={SAMPLE_PRODUCTS[0].image}
            after={SAMPLE_PRODUCTS[2].image}
          />
          <div className="rr-hero-vignette" />
          <div className="rr-hero-watermark">RAFIK&apos;S</div>
          <div className="rr-hero-copy">
            <p className="rr-kicker rr-hero-enter rr-delay-1">
              Made for homes with soul
            </p>
            <h1>
              <span>
                <i>Browse our</i>
              </span>
              <span>
                <i>latest products</i>
              </span>
            </h1>
            <button
              className="rr-pill rr-light rr-hero-enter rr-delay-4"
              onClick={() =>
                lenisRef.current?.scrollTo("#collection", { duration: 1.1 })
              }
            >
              Shop all <ArrowUpRight />
            </button>
          </div>
          {featured && (
            <div className="rr-feature-card rr-hero-enter rr-delay-3">
              <img src={featured.image} alt={featured.name} />
              <div>
                <span>
                  {featured.name}
                  <small>{money(featured.price)}</small>
                </span>
                <b>
                  {String((featureIndex % products.length) + 1).padStart(
                    2,
                    "0",
                  )}{" "}
                  / {String(products.length).padStart(2, "0")}
                </b>
              </div>
              <div className="rr-feature-dots">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    className={
                      index === featureIndex % products.length ? "active" : ""
                    }
                    onClick={() => setFeatureIndex(index)}
                    aria-label={`Show ${product.name}`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {categories.length > 0 && (
          <section
            ref={categorySectionRef}
            className="rr-section rr-categories"
            id="categories"
          >
            <div ref={categoryStickyRef} className="rr-category-sticky">
              <Reveal>
                <SectionHeading
                  kicker="Find your foundation"
                  title="Shop by category"
                />
              </Reveal>
              <div ref={categoryViewportRef} className="rr-category-viewport">
                <div ref={categoryTrackRef} className="rr-category-grid">
                  {categories.map((category, index) => (
                    <Reveal key={category.name} delay={index * 120}>
                      <button
                        className="rr-category"
                        onClick={() => shopCategory(category.name)}
                      >
                        <img
                          src={category.image}
                          alt={`${category.name} collection`}
                        />
                        <span>
                          <strong>{category.name}</strong>
                          <small>
                            {category.count}{" "}
                            {category.count === 1 ? "piece" : "pieces"}{" "}
                            <ArrowUpRight />
                          </small>
                        </span>
                      </button>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rr-service" aria-label="Shopping with Rafik's Rugs">
          {[
            {
              title: "Free shipping",
              text: `On orders over ${money(FREE_SHIPPING_OVER)}`,
              href: "",
            },
            {
              title: "30-day returns",
              text: "Time to see it in your room",
              href: "",
            },
            {
              title: "Made to request",
              text: "Can't find it? Tell us what you need",
              href: "#request",
            },
            {
              title: "Care guidance",
              text: "Practical help for every rug",
              href: "/shipping-returns#care",
            },
          ].map((item, index) => {
            const body = (
              <>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </>
            );
            return (
              <Reveal key={item.title} delay={index * 80}>
                {!item.href ? (
                  <div>{body}</div>
                ) : item.href.startsWith("#") ? (
                  <a href={item.href}>{body}</a>
                ) : (
                  <Link href={item.href}>{body}</Link>
                )}
              </Reveal>
            );
          })}
        </section>

        {spotlight && (
          <section className="rr-spotlight" id="spotlight">
            <Reveal className="rr-spot-image">
              <img src={spotlight.image} alt={spotlight.name} />
            </Reveal>
            <Reveal className="rr-spot-copy" delay={120}>
              <p className="rr-kicker">Product spotlight / 01</p>
              <h2>{spotlight.name}</h2>
              <p className="rr-price">{money(spotlight.price)}</p>
              <p>
                Soft underfoot, carefully finished, and designed to bring
                luminous warmth to everyday rooms.
              </p>
              <button
                className="rr-button"
                onClick={() => addToCart(spotlight)}
              >
                Add to cart
              </button>
              <button
                className="rr-button rr-terra"
                onClick={() => {
                  addToCart(spotlight, false);
                  setCheckout(true);
                }}
              >
                Buy now
              </button>
            </Reveal>
          </section>
        )}

        <section className="rr-section rr-collection" id="collection">
          <Reveal>
            <SectionHeading kicker="Collection / 2026" title="Find your rug" />
          </Reveal>
          <div className="rr-tools">
            <div className="rr-filters">
              {filters.map((name) => (
                <button
                  key={name}
                  className={filter === name ? "active" : ""}
                  onClick={() => setFilter(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <label>
              Sort <ChevronDown size={14} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="featured">Newest</option>
                <option value="low">Price low to high</option>
                <option value="high">Price high to low</option>
                <option value="name">Name A to Z</option>
              </select>
            </label>
          </div>
          <div className="rr-products">
            {visibleCatalog.map((product, index) => (
              <Reveal key={product.id} delay={index * 90}>
                <ProductCard
                  product={product}
                  onView={setSelected}
                  onAdd={addToCart}
                />
              </Reveal>
            ))}
            {catalog.length === 0 && (
              <p
                style={{
                  gridColumn: "1 / -1",
                  padding: "3rem 0",
                  textAlign: "center",
                  opacity: 0.7,
                }}
              >
                {loadFailed
                  ? "We couldn't load our rugs right now. Please try again in a moment."
                  : products.length === 0
                    ? "New rugs are on their way. Check back soon."
                    : "No rugs match this filter."}
              </p>
            )}
          </div>
          {catalog.length > HOME_PRODUCT_LIMIT && (
            <div className="rr-viewall">
              <Link className="rr-pill" href="/collections">
                View all rugs <ArrowUpRight />
              </Link>
            </div>
          )}
        </section>

        <Stats products={products} />

        <section className="rr-request" id="request">
          <Reveal>
            <div>
              <p className="rr-kicker">Can&apos;t find it?</p>
              <h2>Tell us what your room needs.</h2>
              <p>
                Share size, style, colors, and budget. Our sourcing team will
                review your request and follow up with available options.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            {requestSent ? (
              <div className="rr-request-success">
                <Check />
                <h3>Request received</h3>
                <p>
                  Thank you. Our team will review your request and email you
                  with options and a quote.
                </p>
                <button onClick={() => setRequestSent(false)}>
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={submitRequest}>
                <label>
                  Name
                  <input name="name" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required />
                </label>
                <label>
                  Rug type
                  <select name="type" required defaultValue="">
                    <option value="" disabled>
                      Select a type
                    </option>
                    <option>Area rug</option>
                    <option>Runner</option>
                    <option>Shag</option>
                    <option>Vintage</option>
                    <option>Custom</option>
                  </select>
                </label>
                <label>
                  Preferred size
                  <input name="size" placeholder="e.g. 8 × 10 ft" required />
                </label>
                <label>
                  Budget
                  <input name="budget" placeholder="e.g. $150–$300" required />
                </label>
                <label>
                  Material preference (optional)
                  <input name="material" placeholder="e.g. Wool" />
                </label>
                <label className="wide">
                  Describe your ideal rug
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Colors, material, pattern, room, or reference details"
                    required
                  />
                </label>
                <PhotoPicker
                  files={requestPhotos}
                  onChange={setRequestPhotos}
                />
                {requestError && (
                  <p className="wide" role="alert">
                    {requestError}
                  </p>
                )}
                <button className="rr-button wide" disabled={requestSending}>
                  {requestSending ? (
                    "Sending..."
                  ) : (
                    <>
                      Request this rug <ArrowUpRight />
                    </>
                  )}
                </button>
              </form>
            )}
          </Reveal>
        </section>

        <section className="rr-story">
          <Reveal>
            <p className="rr-kicker">Our story / Our craft</p>
          </Reveal>
          <Reveal delay={120}>
            <h2>We truly care about your rug needs...</h2>
          </Reveal>
        </section>
        <section className="rr-newsletter">
          <Reveal>
            <h2>Subscribe to our emails</h2>
          </Reveal>
          <Reveal delay={120}>
            <HomeNewsletterForm />
          </Reveal>
        </section>
        <SocialLinks />
      </main>

      <footer className="rr-footer">
        <Reveal>
          <div className="rr-footer-logo">
            <NextImage
              src="/RafiksRugsLight.png"
              alt="Rafik's Rugs"
              width={900}
              height={900}
            />
          </div>
        </Reveal>
        <div className="rr-footer-grid">
          <div>
            <small>Explore</small>
            <Link href="/collections">Shop all</Link>
            <a href="#request">Request a rug</a>
            <Link href="/search">Search</Link>
          </div>
          <div>
            <small>Customer care</small>
            <Link href="/shipping-returns">Shipping &amp; returns</Link>
            <Link href="/shipping-returns#care">Rug care</Link>
          </div>
          <div>
            <small>Payment methods</small>
            <PaymentBadges />
          </div>
        </div>
        <p>
          © 2026 Rafik&apos;s Rugs · Privacy · Terms · Shipping policy ·{" "}
          <a href="https://www.exchangerate-api.com">
            Rates By Exchange Rate API
          </a>
        </p>
      </footer>

      <Panel
        open={menuOpen}
        className="rr-menu-panel"
        close={() => setMenuOpen(false)}
        title="Menu"
      >
        <nav>
          {[
            ["Home", "home"],
            ["Categories", "categories"],
            ["Shop all", "collection"],
            ["Request a rug", "request"],
          ].map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
          >
            Search
          </button>
        </nav>
      </Panel>
      <Panel
        open={searchOpen}
        close={() => setSearchOpen(false)}
        title="Search"
      >
        <div className="rr-search">
          <label>
            <Search />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rugs"
            />
          </label>
          <div className="rr-search-results">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={(item) => {
                  setSearchOpen(false);
                  setSelected(item);
                }}
                onAdd={addToCart}
              />
            ))}
          </div>
        </div>
      </Panel>
      <Panel
        open={cartOpen}
        className="rr-cart-panel"
        close={() => setCartOpen(false)}
        title={`Your cart (${itemCount})`}
      >
        <div className="rr-cart-items">
          {cart.length > 0 && storeSettings.shippingRate > 0 && (
            <div className="rr-ship-meter">
              <p>
                {totals.shipping === 0 ? (
                  "You've unlocked free shipping."
                ) : (
                  <>
                    Add <strong>{money(FREE_SHIPPING_OVER - total)}</strong>{" "}
                    more for free shipping.
                  </>
                )}
              </p>
              <i aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min(100, (total / FREE_SHIPPING_OVER) * 100)}%`,
                  }}
                />
              </i>
            </div>
          )}
          {cart.length ? (
            cart.map((item) => (
              <div
                className="rr-cart-item"
                key={`${item.id}-${item.size ?? ""}`}
              >
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  {item.size && <small>Size: {item.size}</small>}
                  <small>{money(item.price)}</small>
                  <span>
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => updateQuantity(item.id, -1, item.size)}
                    >
                      <Minus />
                    </button>
                    {item.quantity}
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => updateQuantity(item.id, 1, item.size)}
                    >
                      <Plus />
                    </button>
                    <button
                      type="button"
                      className="rr-remove"
                      aria-label={`Remove ${item.name} from the cart`}
                      onClick={() =>
                        updateQuantity(item.id, -item.quantity, item.size)
                      }
                    >
                      Remove
                    </button>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rr-cart-empty">
              <p>Your cart is empty.</p>
              <button
                type="button"
                className="rr-button"
                onClick={() => {
                  setCartOpen(false);
                  lenisRef.current?.scrollTo("#collection", { duration: 1.1 });
                }}
              >
                Browse rugs
              </button>
            </div>
          )}
        </div>
        <div className="rr-cart-total">
          <span>
            Subtotal <strong>{money(total)}</strong>
          </span>
          <small className="rr-cart-note">
            Shipping and tax are shown at checkout.
          </small>
          <ConversionNote />
          <button
            className="rr-button"
            disabled={!cart.length}
            onClick={() => {
              setCartOpen(false);
              setCheckout(true);
              setCheckoutStep(0);
            }}
          >
            Checkout
          </button>
        </div>
      </Panel>
      <Panel
        open={Boolean(selected)}
        close={() => setSelected(null)}
        title="Product details"
      >
        {selected && (
          <div className="rr-detail">
            <ProductGallery
              images={selected.gallery}
              productName={selected.name}
              compact
            />
            <div className="rr-detail-copy">
              <p className="rr-kicker">{selected.category}</p>
              <h2>{selected.name}</h2>
              <p className="rr-price">
                {selected.oldPrice && <s>{money(selected.oldPrice)}</s>}{" "}
                {money(selected.price)}
              </p>
              <p>
                {selected.description ||
                  "Soft, durable, and selected to ground your room with warmth and character."}
              </p>
              {[
                ["Material", selected.material],
                ["Origin", selected.origin],
                ["Style", selected.style],
                ["Care", selected.care],
              ].some(([, value]) => value) && (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 1rem",
                    display: "grid",
                    gap: ".35rem",
                    fontSize: ".9rem",
                  }}
                >
                  {[
                    ["Material", selected.material],
                    ["Origin", selected.origin],
                    ["Style", selected.style],
                    ["Care", selected.care],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <li key={label}>
                        <strong>{label}:</strong> {value}
                      </li>
                    ))}
                </ul>
              )}
              <SizePicker
                sizes={selected.sizes}
                value={activeSize ?? ""}
                onChange={setSelectedSize}
              />
              <button
                className="rr-button"
                disabled={!canBuy(selected)}
                onClick={() => addToCart(selected, true, activeSize)}
              >
                {canBuy(selected) ? "Add to cart" : "Sold out"}
              </button>
              <p>
                <Link href={`/products/${selected.slug}`}>
                  View full details
                </Link>
              </p>
            </div>
          </div>
        )}
      </Panel>
      <Panel
        open={checkout}
        className="rr-checkout-panel"
        close={() => setCheckout(false)}
        title="Checkout"
      >
        {checkoutStep < 3 ? (
          <div className="rr-checkout">
            <div className="rr-checkout-main">
              <div className="rr-steps">
                {["Information", "Payment", "Review"].map((label, index) => (
                  <b
                    key={label}
                    className={
                      checkoutStep === index
                        ? "active"
                        : checkoutStep > index
                          ? "done"
                          : ""
                    }
                  >
                    {String(index + 1).padStart(2, "0")} {label}
                  </b>
                ))}
              </div>
              {checkoutStep === 0 && (
                <CheckoutForm
                  title="Where should we send it?"
                  fields={INFO_FIELDS}
                  values={details}
                  onChange={setDetail}
                  submit={submitCheckout}
                  button="Continue to payment"
                />
              )}
              {checkoutStep === 1 && (
                <CheckoutForm
                  title="Payment"
                  notice={
                    payMethod === "card"
                      ? "Demo checkout: no payment is taken, so please don't enter real card details."
                      : `Demo checkout: no payment is taken. With a real checkout, ${paymentLabel(payMethod)} would be set up here.`
                  }
                  before={
                    <PaymentMethodPicker
                      value={payMethod}
                      onChange={setPayMethod}
                    />
                  }
                  fields={payMethod === "card" ? PAYMENT_FIELDS : []}
                  submit={submitCheckout}
                  onBack={() => setCheckoutStep(0)}
                  button="Review order"
                />
              )}
              {checkoutStep === 2 && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setCheckoutStep(3);
                    setCart([]);
                    setDetails({});
                    setPayMethod("card");
                  }}
                >
                  <h2>Ready to place your order</h2>
                  <p className="rr-checkout-address">
                    Sending to{" "}
                    {[details.firstName, details.lastName]
                      .filter(Boolean)
                      .join(" ")}
                    , {details.address}, {details.city} {details.postal}
                    {details.phone ? ` · ${details.phone}` : ""}
                  </p>
                  <p className="rr-checkout-address">
                    Payment: {paymentLabel(payMethod)}
                  </p>
                  <p>
                    This storefront prototype does not process a real payment.
                  </p>
                  <div className="rr-checkout-actions">
                    <button
                      type="button"
                      className="rr-back"
                      onClick={() => setCheckoutStep(1)}
                    >
                      Back
                    </button>
                    <button className="rr-button">Place order</button>
                  </div>
                </form>
              )}
            </div>
            <aside>
              <details>
                <summary>
                  <span>Order summary</span>
                  <strong>{money(totals.total)}</strong>
                </summary>
                <div>
                  <h3>Order summary</h3>
                  {cart.map((item) => (
                    <p key={`${item.id}-${item.size ?? ""}`}>
                      {item.name}
                      {item.size ? ` (${item.size})` : ""} × {item.quantity}
                      <strong>{money(item.price * item.quantity)}</strong>
                    </p>
                  ))}
                  <hr />
                  <p>
                    Subtotal <strong>{money(total)}</strong>
                  </p>
                  <p>
                    Shipping{" "}
                    <strong>
                      {totals.shipping === 0 ? "Free" : money(totals.shipping)}
                    </strong>
                  </p>
                  {storeSettings.taxRate > 0 && (
                    <p>
                      Tax ({storeSettings.taxRate}%){" "}
                      <strong>{money(totals.tax)}</strong>
                    </p>
                  )}
                  <p>
                    Total <strong>{money(totals.total)}</strong>
                  </p>
                  <ConversionNote />
                </div>
              </details>
            </aside>
          </div>
        ) : (
          <div className="rr-confirm">
            <span>
              <Check />
            </span>
            <h2>Thank you</h2>
            <p>Your prototype order is confirmed.</p>
            <button className="rr-button" onClick={() => setCheckout(false)}>
              Continue shopping
            </button>
          </div>
        )}
      </Panel>
      <button
        className={`rr-scroll-top ${showScrollTop ? "visible" : ""}`}
        onClick={() => lenisRef.current?.scrollTo(0, { duration: 1.1 })}
        aria-label="Scroll to top"
      >
        <ArrowUp />
      </button>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="rr-section-head">
      <p className="rr-kicker">{kicker}</p>
      <h2>{title}</h2>
    </div>
  );
}

function ProductCard({
  product,
  onView,
  onAdd,
}: {
  product: Product;
  onView: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const money = useMoney();
  const buyable = canBuy(product);
  return (
    <article className="rr-product">
      {!buyable ? (
        <em>Sold out</em>
      ) : (
        <>
          {product.oldPrice && <em>Sale</em>}
          {product.newArrival && <em className="rr-new">New</em>}
        </>
      )}
      <WishlistButton productId={product.id} name={product.name} />
      <button className="rr-product-image" onClick={() => onView(product)}>
        <img src={product.image} alt={product.name} />
      </button>
      <div>
        <button onClick={() => onView(product)}>
          <strong>{product.name}</strong>
          <small>{product.category}</small>
        </button>
        <span>
          {product.oldPrice && <s>{money(product.oldPrice)}</s>}{" "}
          {money(product.price)}
        </span>
        <button
          className="rr-add"
          disabled={!buyable}
          style={buyable ? undefined : { opacity: 0.4, cursor: "not-allowed" }}
          onClick={() => onAdd(product)}
          aria-label={
            buyable
              ? `Add ${product.name} to cart`
              : `${product.name} is sold out`
          }
        >
          <Plus />
        </button>
      </div>
    </article>
  );
}

function Panel({
  open,
  close,
  title,
  className = "",
  children,
}: {
  open: boolean;
  close: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <aside
      className={`rr-panel ${open ? "open" : ""} ${className}`}
      aria-hidden={!open}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <header>
        <strong>{title}</strong>
        <button onClick={close}>
          Close <X />
        </button>
      </header>
      <div className="rr-panel-scroll" data-lenis-prevent>
        {children}
      </div>
    </aside>
  );
}

type CheckoutField = {
  key: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "tel";
  maxLength?: number;
  wide?: boolean;
  optional?: boolean;
};

const INFO_FIELDS: CheckoutField[] = [
  {
    key: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    wide: true,
  },
  { key: "firstName", label: "First name", autoComplete: "given-name" },
  { key: "lastName", label: "Last name", autoComplete: "family-name" },
  {
    key: "address",
    label: "Address",
    autoComplete: "address-line1",
    wide: true,
  },
  { key: "city", label: "City", autoComplete: "address-level2" },
  { key: "postal", label: "Postal code", autoComplete: "postal-code" },
  {
    key: "phone",
    label: "Phone number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    maxLength: 20,
    optional: true,
    wide: true,
  },
];

const PAYMENT_FIELDS: CheckoutField[] = [
  {
    key: "cardNumber",
    label: "Card number",
    autoComplete: "cc-number",
    inputMode: "numeric",
    maxLength: 23,
    wide: true,
  },
  {
    key: "expiry",
    label: "Expiry",
    autoComplete: "cc-exp",
    inputMode: "numeric",
    maxLength: 7,
  },
  {
    key: "cvc",
    label: "Security code",
    autoComplete: "cc-csc",
    inputMode: "numeric",
    maxLength: 4,
  },
  {
    key: "cardName",
    label: "Name on card",
    autoComplete: "cc-name",
    wide: true,
  },
];

// Information fields are kept in the parent, so Back doesn't lose them.
// Card fields are deliberately not stored anywhere.
function CheckoutForm({
  title,
  fields,
  values,
  onChange,
  notice,
  before,
  button,
  submit,
  onBack,
}: {
  title: string;
  fields: CheckoutField[];
  values?: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  notice?: string;
  before?: ReactNode;
  button: string;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
}) {
  return (
    <form onSubmit={submit}>
      <h2>{title}</h2>
      {notice && (
        <p className="rr-checkout-notice" role="note">
          {notice}
        </p>
      )}
      {before}
      <div className="rr-checkout-fields">
        {fields.map((field) => (
          <label key={field.key} className={field.wide ? "wide" : undefined}>
            <span>
              {field.label}
              {field.optional && <span className="rr-optional"> (optional)</span>}
            </span>
            <input
              required={!field.optional}
              name={field.key}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              maxLength={field.maxLength}
              value={values ? (values[field.key] ?? "") : undefined}
              onChange={
                values
                  ? (event: React.ChangeEvent<HTMLInputElement>) =>
                      onChange?.(field.key, event.target.value)
                  : undefined
              }
            />
          </label>
        ))}
      </div>
      <div className="rr-checkout-actions">
        {onBack && (
          <button type="button" className="rr-back" onClick={onBack}>
            Back
          </button>
        )}
        <button className="rr-button">{button}</button>
      </div>
    </form>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`rr-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function LiquidReveal({ before, after }: { before: string; after: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wrap = wrapRef.current,
      canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const context = canvas.getContext("2d"),
      cover = document.createElement("canvas"),
      coverContext = cover.getContext("2d"),
      brush = document.createElement("canvas"),
      brushContext = brush.getContext("2d");
    if (!context || !coverContext || !brushContext) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = after;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let dpr = Math.min(devicePixelRatio, 2),
      radius = 143 * dpr,
      diameter = Math.ceil(radius * 2),
      idle = 121,
      animation = 0,
      touching = false,
      last: { x: number; y: number } | null = null;
    let points: { x: number; y: number }[] = [];
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio, 2);
      radius = (coarse ? Math.min(rect.width * 0.3, 132) : 143) * dpr;
      diameter = Math.ceil(radius * 2);
      canvas.width = cover.width = Math.round(rect.width * dpr);
      canvas.height = cover.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      brush.width = brush.height = diameter;
      coverContext.clearRect(0, 0, cover.width, cover.height);
      if (image.complete && image.naturalWidth) {
        const scale = Math.max(
            cover.width / image.naturalWidth,
            cover.height / image.naturalHeight,
          ),
          width = image.naturalWidth * scale,
          height = image.naturalHeight * scale;
        coverContext.drawImage(
          image,
          (cover.width - width) / 2,
          (cover.height - height) / 2,
          width,
          height,
        );
        if (coarse)
          points.push({ x: canvas.width * 0.52, y: canvas.height * 0.62 });
      }
    };
    image.onload = resize;
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    resize();
    const stamp = ({ x, y }: { x: number; y: number }) => {
      brushContext.clearRect(0, 0, diameter, diameter);
      brushContext.globalCompositeOperation = "source-over";
      const gradient = brushContext.createRadialGradient(
        radius,
        radius,
        0,
        radius,
        radius,
        radius,
      );
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.55, "rgba(255,255,255,.82)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      brushContext.fillStyle = gradient;
      brushContext.fillRect(0, 0, diameter, diameter);
      brushContext.globalCompositeOperation = "source-in";
      brushContext.drawImage(cover, -x + radius, -y + radius);
      context.globalCompositeOperation = "source-over";
      context.drawImage(brush, x - radius, y - radius);
    };
    const pointer = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect(),
        x = (event.clientX - rect.left) * dpr,
        y = (event.clientY - rect.top) * dpr;
      if (
        x < -radius ||
        y < -radius ||
        x > canvas.width + radius ||
        y > canvas.height + radius
      ) {
        last = null;
        return;
      }
      if (!last) points.push({ x, y });
      else {
        const dx = x - last.x,
          dy = y - last.y,
          distance = Math.hypot(dx, dy),
          count = Math.min(Math.ceil(distance / Math.max(radius * 0.3, 1)), 60);
        for (let index = 1; index <= count; index++)
          points.push({
            x: last.x + (dx * index) / count,
            y: last.y + (dy * index) / count,
          });
      }
      last = { x, y };
    };
    const tick = () => {
      const drawing = points.length > 0;
      idle = drawing ? 0 : idle + 1;
      if (idle <= 120) {
        context.globalCompositeOperation = "destination-out";
        context.fillStyle = `rgba(0,0,0,${drawing ? 0.016 : Math.min(0.016 + idle * 0.004, 0.5)})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (drawing) {
          points.forEach(stamp);
          points = [];
        } else if (idle === 120)
          context.clearRect(0, 0, canvas.width, canvas.height);
      }
      animation = requestAnimationFrame(tick);
    };
    const down = (event: PointerEvent) => {
      if (!coarse) return;
      touching = true;
      last = null;
      wrap.setPointerCapture?.(event.pointerId);
      pointer(event);
      wrap.classList.add("is-touching");
    };
    const move = (event: PointerEvent) => {
      if (!coarse || touching) pointer(event);
    };
    const up = (event: PointerEvent) => {
      if (!coarse) return;
      touching = false;
      last = null;
      wrap.releasePointerCapture?.(event.pointerId);
      wrap.classList.remove("is-touching");
    };
    window.addEventListener("pointermove", move, { passive: true });
    wrap.addEventListener("pointerdown", down);
    wrap.addEventListener("pointerup", up);
    wrap.addEventListener("pointercancel", up);
    animation = requestAnimationFrame(tick);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerdown", down);
      wrap.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointercancel", up);
      cancelAnimationFrame(animation);
    };
  }, [after]);

  return (
    <div className="rr-liquid" ref={wrapRef}>
      <img src={before} alt="A room before styling" />
      <canvas
        ref={canvasRef}
        aria-label="Touch and move across the hero to reveal a second styled room"
      />
    </div>
  );
}

function Stats({ products }: { products: Product[] }) {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(0); // 0 to 1: how far the section has scrolled into view

  // Only show numbers that mean something for the real products
  const stats = useMemo(
    () =>
      [
        { target: products.length, label: "Curated rug designs" },
        {
          target: new Set(products.map((product) => product.category)).size,
          label: "Shop-ready collections",
        },
        { target: products.filter(canBuy).length, label: "Ready to ship" },
        {
          target: products.filter((product) => product.oldPrice).length,
          label: "Current sale picks",
        },
      ].filter((stat) => stat.target > 0),
    [products],
  );

  useEffect(() => {
    let last = 0;
    const update = () => {
      if (performance.now() - last < 30 || !ref.current) return;
      last = performance.now();
      const rect = ref.current.getBoundingClientRect(),
        start = innerHeight,
        end = innerHeight / 2 - rect.height / 2;
      setScrolled(Math.max(0, Math.min(1, (start - rect.top) / (start - end))));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (stats.length === 0) return null;

  return (
    <section ref={ref} className="rr-stats">
      <Reveal>
        <div className="rr-stats-panel">
          <p className="rr-kicker">By the numbers</p>
          <h2>Proof in the details, not the noise.</h2>
          <ul>
            {stats.map((stat, index) => (
              <li
                key={stat.label}
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <strong>{Math.round(scrolled * stat.target)}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
