export const DEFAULT_CURRENCY = "USD";

const LOCALES: Record<string, string> = {
  USD: "en-US",
  NGN: "en-NG",
  GBP: "en-GB",
  EUR: "de-DE",
  CAD: "en-CA",
  AED: "en-AE",
};

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (value === null || value === undefined || Number.isNaN(value)) return "";

  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  const hasCents = Math.round(value * 100) % 100 !== 0;

  try {
    return new Intl.NumberFormat(LOCALES[code] ?? "en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString("en-US")}`;
  }
}
