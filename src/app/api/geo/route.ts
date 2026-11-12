import { headers } from "next/headers";

// Tells the browser which country the visitor is in, using the header that the
// host adds (Vercel: x-vercel-ip-country, Cloudflare: cf-ipcountry).
// When running on your own computer there is no such header, so country is null
// and the storefront falls back to the browser language.
export const dynamic = "force-dynamic";

export async function GET() {
  const h = await headers();
  const raw = (
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    ""
  ).toUpperCase();
  const country =
    /^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1" ? raw : null;
  return Response.json(
    { country },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
