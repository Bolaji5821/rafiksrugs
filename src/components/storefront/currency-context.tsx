"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/currency";

type CurrencyContextValue = {
  currency: string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
});

export function CurrencyProvider({
  currency = DEFAULT_CURRENCY,
  children,
}: {
  currency?: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ currency }), [currency]);
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useMoney() {
  const { currency } = useContext(CurrencyContext);
  return useMemo(() => {
    const fn = (amount: number | string | null | undefined) =>
      formatMoney(amount, currency);
    return Object.assign(fn, { money: fn, format: fn, currency });
  }, [currency]);
}
