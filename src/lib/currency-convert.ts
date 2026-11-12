// Helpers for showing prices in the visitor's own currency.
// Prices are stored in the shop's base currency (set in the admin Settings page).
// Conversion is for display only: orders are still in the base currency.

// Must match the currencies the backend converts (backend/utils/exchangeRates.js)
export const DISPLAY_CURRENCIES = ["USD", "NGN", "GBP", "EUR", "CAD", "AED"];

export type Rates = Record<string, number>;

const EURO_COUNTRIES = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

const COUNTRY_CURRENCY: Record<string, string> = {
  NG: "NGN",
  GB: "GBP",
  US: "USD",
  CA: "CAD",
  AE: "AED",
};

// "NG" -> "NGN". Returns null for countries we don't have a currency for.
export function currencyForCountry(
  country: string | null | undefined,
): string | null {
  const code = (country || "").toUpperCase();
  if (EURO_COUNTRIES.has(code)) return "EUR";
  return COUNTRY_CURRENCY[code] ?? null;
}

// Fallback when the host doesn't tell us the country: the region of the browser
// language, e.g. "en-NG" -> "NG".
export function countryFromBrowser(
  languages: readonly string[] | undefined,
): string | null {
  for (const tag of languages ?? []) {
    const region = tag.split("-")[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  }
  return null;
}

// Whole numbers for big amounts (₦1,384,700), two decimals for small ones.
function roundForDisplay(value: number, currency: string): number {
  if (currency === "NGN") return Math.round(value / 10) * 10;
  return value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
}

// Converts an amount in the base currency into the display currency.
// Returns the amount unchanged when no conversion is needed or possible.
export function convertAmount(
  value: number,
  base: string,
  target: string,
  rates: Rates | null,
): number {
  if (base === target || !rates) return value;
  const from = rates[base] ?? (base === "USD" ? 1 : undefined);
  const to = rates[target];
  if (!from || !to) return value;
  return roundForDisplay((value / from) * to, target);
}
