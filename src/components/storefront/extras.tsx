"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import "./extras.css";

const WISHLIST_KEY = "rafiks-wishlist";
const WISHLIST_EVENT = "rafiks-wishlist";
const WISHLIST_MAX = 100;

function readWishlist(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === "number")
      : [];
  } catch {
    return [];
  }
}

// Most recently saved first. Every heart on the page updates together, and so do
// other tabs, because the list announces each change.
export function useWishlist() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setIds(readWishlist());
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: number) => {
    const current = readWishlist();
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [id, ...current].slice(0, WISHLIST_MAX);
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    } catch {
      /* private mode: the heart just won't stick */
    }
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  }, []);

  return { ids, toggle, has: (id: number) => ids.includes(id) };
}

// The heart in the header, next to the cart
export function WishlistLink({ className = "" }: { className?: string }) {
  const { ids } = useWishlist();
  return (
    <Link
      className={`wish-link ${className}`}
      href="/wishlist"
      aria-label={`Wishlist, ${ids.length} ${ids.length === 1 ? "rug" : "rugs"} saved`}
    >
      <Heart aria-hidden="true" />
      <span>Wishlist</span>
      {ids.length > 0 && <i>{ids.length}</i>}
    </Link>
  );
}

// The heart on a product card ("icon") or the labelled button on the product page ("full")
export function WishlistButton({
  productId,
  name,
  variant = "icon",
}: {
  productId: number;
  name: string;
  variant?: "icon" | "full";
}) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <button
      type="button"
      className={`wish-btn wish-btn-${variant} ${saved ? "is-saved" : ""}`}
      aria-pressed={saved}
      aria-label={
        saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`
      }
      onClick={(event) => {
        // Cards sit inside links: saving must not open the product
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
    >
      <Heart aria-hidden="true" />
      {variant === "full" && <span>{saved ? "Saved" : "Save for later"}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Social links (static). Put the real addresses in SOCIAL_LINKS.      */
/* ------------------------------------------------------------------ */

const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://www.instagram.com/" },
  { name: "Facebook", href: "https://www.facebook.com/" },
  { name: "X", href: "https://x.com/" },
  { name: "YouTube", href: "https://www.youtube.com/" },
];

function SocialIcon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  switch (name) {
    case "Instagram":
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
        </svg>
      );
    case "Facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "X":
      return (
        <svg {...common} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return (
        <svg {...common} {...stroke}>
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );
  }
}

export function SocialLinks() {
  return (
    <div className="social-row">
      <p>Follow along</p>
      <ul>
        {SOCIAL_LINKS.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Rafik's Rugs on ${item.name}`}
            >
              <SocialIcon name={item.name} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Payment methods                                                      */
/* ------------------------------------------------------------------ */

export const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit or debit card",
    hint: "Visa, Mastercard, Amex, Discover",
  },
  { id: "paypal", label: "PayPal", hint: "Pay with your PayPal account" },
  { id: "applepay", label: "Apple Pay", hint: "Pay with Face ID or Touch ID" },
  {
    id: "googlepay",
    label: "Google Pay",
    hint: "Pay with your saved Google cards",
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function paymentLabel(id: string) {
  return PAYMENT_METHODS.find((method) => method.id === id)?.label ?? "Card";
}

// Small labels for the footer ("we accept ...")
export function PaymentBadges() {
  return (
    <ul className="pay-badges" aria-label="Payment methods">
      {[
        "Visa",
        "Mastercard",
        "Amex",
        "Discover",
        "PayPal",
        "Apple Pay",
        "Google Pay",
      ].map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
}

// The choice on the payment step of checkout
export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
}) {
  return (
    <fieldset className="pay-picker">
      <legend>Payment method</legend>
      {PAYMENT_METHODS.map((method) => (
        <label key={method.id} className={value === method.id ? "is-on" : ""}>
          <input
            type="radio"
            name="paymentMethod"
            value={method.id}
            checked={value === method.id}
            onChange={() => onChange(method.id)}
          />
          <span>
            <strong>{method.label}</strong>
            <small>{method.hint}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Back button (product page) and size picker                           */
/* ------------------------------------------------------------------ */

// Goes back to where the visitor came from (collection, search, wishlist, home).
// If they opened the page directly there is nothing to go back to, so it goes to `fallback`.
export function BackButton({
  fallback = "/collections",
  label = "Back",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="back-btn"
      onClick={() => {
        const cameFromHere =
          document.referrer &&
          new URL(document.referrer).origin === window.location.origin;
        if (cameFromHere && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <ArrowLeft aria-hidden="true" /> {label}
    </button>
  );
}

// Sizes as a grid of buttons, one selected (replaces the drop-down)
export function SizePicker({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string;
  onChange: (size: string) => void;
}) {
  if (sizes.length === 0) return null;
  return (
    <div className="size-picker" role="radiogroup" aria-label="Size">
      <p>
        Size: <strong>{value || sizes[0]}</strong>
      </p>
      <div>
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={(value || sizes[0]) === size}
            className={(value || sizes[0]) === size ? "is-on" : ""}
            onClick={() => onChange(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
