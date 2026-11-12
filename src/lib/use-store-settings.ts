"use client";

import { useEffect, useState } from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

type StoreSettings = { shippingRate: number; taxRate: number };

const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;

let saved: StoreSettings | null = null; // kept for the whole visit

// The shipping rate and tax rate the owner set in the admin Settings page.
// The first render uses 0 (same as the server); the real numbers arrive a moment later.
// If the backend can't be reached, no shipping or tax is added.
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(
    () => saved ?? { shippingRate: 0, taxRate: 0 },
  );

  useEffect(() => {
    if (saved) return;
    let cancelled = false;
    fetch(`${API_URL}/api/public/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        saved = {
          shippingRate: number(data.shippingRate),
          taxRate: number(data.taxRate),
        };
        setSettings(saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
