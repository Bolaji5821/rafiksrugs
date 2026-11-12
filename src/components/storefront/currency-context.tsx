"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/currency";
import {
  DISPLAY_CURRENCIES,
  convertAmount,
  countryFromBrowser,
  currencyForCountry,
  type Rates,
} from "@/lib/currency-convert";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");
const CHOICE_KEY = "rafiks-currency"; // the visitor's own pick, remembered in the browser

type CurrencyState = {
  base: string; // the shop's currency (what prices are stored in)
  display: string; // what this visitor sees
  options: string[]; // currencies the visitor can switch to (empty until rates load)
  setDisplay: (code: string) => void;
};

const CurrencyContext = createContext<CurrencyState & { rates: Rates | null }>({
  base: DEFAULT_CURRENCY,
  display: DEFAULT_CURRENCY,
  options: [],
  rates: null,
  setDisplay: () => {},
});

// Kept for the whole visit, so moving between pages doesn't ask again
let resolved: { base: string; rates: Rates | null; display: string } | null =
  null;

async function loadRates(base: string): Promise<Rates | null> {
  try {
    const res = await fetch(`${API_URL}/api/public/rates`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // If the owner changed the base currency, rates for the old one are useless
    if (data.base !== base || !data.rates || typeof data.rates !== "object")
      return null;
    return data.rates as Rates;
  } catch {
    return null;
  }
}

async function visitorCurrency(): Promise<string | null> {
  try {
    const res = await fetch("/api/geo", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const fromHost = currencyForCountry(data.country);
      if (fromHost) return fromHost;
    }
  } catch {
    /* fall back to the browser language below */
  }
  return currencyForCountry(countryFromBrowser(navigator.languages));
}

// Wraps a page so every price below it is shown in the visitor's currency.
// `currency` is the shop's base currency from the admin Settings page.
export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: ReactNode;
}) {
  // The first render must match the server (base currency); after a page change
  // within the site we can start from what we already worked out.
  const [state, setState] = useState<{ rates: Rates | null; display: string }>(
    () =>
      resolved && resolved.base === currency
        ? { rates: resolved.rates, display: resolved.display }
        : { rates: null, display: currency },
  );

  useEffect(() => {
    if (resolved && resolved.base === currency) return;
    let cancelled = false;

    (async () => {
      const rates = await loadRates(currency);
      if (cancelled) return;
      if (!rates) {
        resolved = { base: currency, rates: null, display: currency };
        return; // no rates: keep showing the base currency
      }

      const usable = (code: string | null | undefined): code is string =>
        !!code &&
        DISPLAY_CURRENCIES.includes(code) &&
        typeof rates[code] === "number";

      let stored: string | null = null;
      try {
        stored = localStorage.getItem(CHOICE_KEY);
      } catch {
        /* private window: ignore */
      }
      const detected = usable(stored) ? stored : await visitorCurrency();
      if (cancelled) return;

      const display = usable(detected) ? detected : currency;
      resolved = { base: currency, rates, display };
      setState({ rates, display });
    })();

    return () => {
      cancelled = true;
    };
  }, [currency]);

  const setDisplay = useCallback((code: string) => {
    setState((s) =>
      s.rates && typeof s.rates[code] === "number"
        ? { ...s, display: code }
        : s,
    );
    if (resolved) resolved.display = code;
    try {
      localStorage.setItem(CHOICE_KEY, code);
    } catch {
      /* private window: ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      base: currency,
      display: state.display,
      rates: state.rates,
      options: state.rates
        ? DISPLAY_CURRENCIES.filter((c) => typeof state.rates![c] === "number")
        : [],
      setDisplay,
    }),
    [currency, state, setDisplay],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// const money = useMoney();  money(12.5) -> "₦18,750" (or "$12.50" if no conversion)
export function useMoney() {
  const { base, display, rates } = useContext(CurrencyContext);
  return useCallback(
    (value: number) =>
      formatMoney(convertAmount(value, base, display, rates), display),
    [base, display, rates],
  );
}

// For the currency picker and the "prices are approximate" note
export function useCurrencyInfo(): CurrencyState {
  const { base, display, options, setDisplay } = useContext(CurrencyContext);
  return { base, display, options, setDisplay };
}
