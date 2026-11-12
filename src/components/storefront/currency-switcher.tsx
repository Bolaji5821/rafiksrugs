"use client";

import { ChevronDown, Globe } from "lucide-react";
import {
  useCurrencyInfo,
  useMoney,
} from "@/components/storefront/currency-context";

const NAMES: Record<string, string> = {
  USD: "US dollar",
  NGN: "Nigerian naira",
  GBP: "British pound",
  EUR: "Euro",
  CAD: "Canadian dollar",
  AED: "UAE dirham",
};

// A small pill with a globe and the currency code, e.g. "🌐 NGN ⌄".
// It uses the colour of the place it sits in, so it fits the dark header on the
// home page and the light header on the other pages. The real <select> is laid
// invisibly on top, so it opens the phone's own picker and works with a keyboard.
// Shows nothing until the exchange rates have loaded, and nothing if they can't load.
export function CurrencySwitcher() {
  const { display, options, setDisplay } = useCurrencyInfo();
  if (options.length < 2) return null;
  return (
    <>
      <style>{`
        .rr-currency{transition:background-color .2s}
        .rr-currency:hover{background:color-mix(in srgb,currentColor 12%,transparent)}
        .rr-currency:focus-within{outline:2px solid currentColor;outline-offset:3px}
        @media(max-width:640px){
          .rr-currency{padding:.4rem .6rem;gap:.25rem;letter-spacing:.05em}
          .rr-currency>svg:first-child{display:none}
          .rr-nav-actions{gap:.75rem}
        }
      `}</style>
      <label
        className="rr-currency"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "center",
          gap: ".4rem",
          padding: ".45rem .8rem",
          border: "1px solid color-mix(in srgb, currentColor 50%, transparent)",
          borderRadius: 999,
          color: "inherit",
          fontSize: ".75rem",
          lineHeight: 1,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        <Globe size={14} aria-hidden="true" />
        <span aria-hidden="true">{display}</span>
        <ChevronDown size={12} aria-hidden="true" />
        <select
          value={display}
          onChange={(event) => setDisplay(event.target.value)}
          aria-label="Choose currency"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            fontSize: 16, // stops phones zooming in when it opens
          }}
        >
          {options.map((code) => (
            <option
              key={code}
              value={code}
              style={{ color: "#111", background: "#fff" }}
            >
              {NAMES[code] ? `${code} · ${NAMES[code]}` : code}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

// Shown near the cart and checkout when prices have been converted
export function ConversionNote() {
  const { base, display } = useCurrencyInfo();
  if (base === display) return null;
  return (
    <small
      style={{
        display: "block",
        opacity: 0.7,
        fontSize: 12,
        margin: ".4rem 0",
      }}
    >
      Prices in {display} are approximate. Orders are charged in {base}.
    </small>
  );
}

// A price that follows the visitor's currency. Use it in server-rendered pages
// (like the product page), where the hook can't be used directly.
export function Price({ value }: { value: number }) {
  const money = useMoney();
  return <>{money(value)}</>;
}
