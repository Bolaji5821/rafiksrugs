// Turns "Glam White & Gold Rug" into "glam-white-and-gold-rug" for use in addresses
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// The address part of a category page: "Area rugs" -> "area-rugs"
export const categorySlug = slugify;

// A product's address is "<name>-<id>", e.g. "persian-runner-12".
// The id at the end is what is used to look the product up.
export function productIdFromSlug(slug: string): number | null {
  const match = slug.match(/(?:^|-)(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
