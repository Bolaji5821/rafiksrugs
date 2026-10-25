import type { Product } from "@/lib/catalog";
import { slugify } from "@/lib/slug";

// Where the Rafik's Rugs backend lives. Set NEXT_PUBLIC_API_URL in .env.local
// (and in the hosting dashboard for production).
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

// Shown for a rug that has no photos yet
const PLACEHOLDER_IMAGE = "/RafiksRugs.png";

// What GET /api/public/products returns for each product (see docs/public-api.md)
type ApiProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string | null;
  images: string[];
  availability: "in_stock" | "sold_out" | "unavailable";
  // Optional details the owner fills in on the admin product form
  description: string | null;
  material: string | null;
  origin: string | null;
  style: string | null;
  sizes: string[];
  care: string | null;
  oldPrice: number | null;
};

// Turns an API product into the shape the storefront components already use.
// Details the owner has not filled in become empty text / an empty list.
export function toStoreProduct(p: ApiProduct): Product {
  const photos = p.images?.length ? p.images : p.image ? [p.image] : [];
  const image = photos[0] ?? PLACEHOLDER_IMAGE;

  return {
    id: p.id,
    slug: `${slugify(p.name)}-${p.id}`, // the id keeps it unique
    name: p.name,
    category: p.category,
    price: p.price,
    // Only shown (crossed out) when it is higher than the real price
    oldPrice: p.oldPrice && p.oldPrice > p.price ? p.oldPrice : undefined,
    image,
    gallery: photos.length ? photos : [image],
    description: p.description ?? "",
    material: p.material ?? "",
    origin: p.origin ?? "",
    style: p.style ?? "",
    sizes: p.sizes ?? [],
    care: p.care ?? "",
    // The public API hides the exact stock on purpose, so this is only 0 or 1
    inventory: p.availability === "in_stock" ? 1 : 0,
    availability: p.availability,
  };
}

// Next.js keeps each API answer for 60 seconds, so a change made in the admin
// shows up on the storefront within about a minute.
const CACHE = { next: { revalidate: 60 } } as const;

const PAGE_SIZE = 50; // the most the API returns per request
const MAX_PAGES = 10; // safety stop: 500 products

// Loads every visible product (all pages) for the landing page, collections,
// search and the sitemap. Runs on the server.
export async function getStoreProducts(): Promise<{
  products: Product[];
  failed: boolean;
}> {
  try {
    const products: Product[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(
        `${API_URL}/api/public/products?limit=${PAGE_SIZE}&page=${page}`,
        CACHE,
      );
      if (!res.ok)
        throw new Error(`The API answered with status ${res.status}`);

      const data = (await res.json()) as {
        products: ApiProduct[];
        pagination: { totalPages: number };
      };
      products.push(...data.products.map(toStoreProduct));
      totalPages = data.pagination.totalPages;
      page += 1;
    } while (page <= totalPages && page <= MAX_PAGES);

    return { products, failed: false };
  } catch (err) {
    console.error("Could not load products from the API:", err);
    return { products: [], failed: true };
  }
}

// Loads one product by its id. `product` is null when it does not exist or is
// hidden in the admin (the API answers 404); `failed` means the API could not
// be reached or had a problem, which is a different thing.
export async function getStoreProduct(
  id: number,
): Promise<{ product: Product | null; failed: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/public/products/${id}`, CACHE);
    if (res.status === 404) return { product: null, failed: false };
    if (!res.ok) throw new Error(`The API answered with status ${res.status}`);

    const data = (await res.json()) as { product: ApiProduct };
    return { product: toStoreProduct(data.product), failed: false };
  } catch (err) {
    console.error("Could not load the product from the API:", err);
    return { product: null, failed: true };
  }
}
