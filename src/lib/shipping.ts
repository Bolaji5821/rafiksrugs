// Orders of this amount or more (in the shop's base currency, USD) ship free.
// This number is also used in the "Free shipping" messages, so change it here only.
// (It is not a Settings-page field yet.)
export const FREE_SHIPPING_OVER = 100;

// Works out shipping, tax and the final total for a cart.
// shippingRate: flat amount per order. taxRate: percent, charged on the goods.
export function orderTotals(
  subtotal: number,
  shippingRate: number,
  taxRate: number,
) {
  const shipping =
    subtotal <= 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : shippingRate;
  const tax = Math.round(subtotal * taxRate) / 100; // 2 decimals
  return { shipping, tax, total: subtotal + shipping + tax };
}
