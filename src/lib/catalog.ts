export type Product = {
  id: number;
  slug: string;
  name: string;
  category: "Area rugs" | "Runners" | "Shag" | "Vintage";
  price: number;
  oldPrice?: number;
  image: string;
  gallery: string[];
  description: string;
  material: string;
  origin: string;
  style: string;
  sizes: string[];
  care: string;
  inventory: number;
  featured?: boolean;
  newArrival?: boolean;
};

const images = {
  glam: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1600&q=85",
  trellis: "https://images.unsplash.com/photo-1583845112203-29329902332e?auto=format&fit=crop&w=1600&q=85",
  vintage: "https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?auto=format&fit=crop&w=1600&q=85",
  runner: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
  shag: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=85",
  passage: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?auto=format&fit=crop&w=1600&q=85",
  rose: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85",
  cloud: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1600&q=85",
};

const detailImages = [
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=85",
];

export const PRODUCTS: Product[] = [
  { id: 1, slug: "glam-white-gold-rug", name: "Glam White & Gold Rug", category: "Area rugs", price: 129.99, image: images.glam, gallery: [images.glam, ...detailImages], description: "A luminous cream foundation with warm gold character, selected for calm rooms that still deserve a statement.", material: "Polypropylene and soft-touch polyester", origin: "Turkey", style: "Modern glam", sizes: ["5 × 7 ft", "6 × 9 ft", "8 × 10 ft"], care: "Vacuum without a beater bar. Blot spills immediately with a clean, dry cloth.", inventory: 12, featured: true },
  { id: 2, slug: "moroccan-trellis-rug", name: "Moroccan Trellis Rug", category: "Area rugs", price: 149.99, image: images.trellis, gallery: [images.trellis, detailImages[0], images.shag], description: "Graphic trellis lines and a soft neutral pile bring structure without making a room feel busy.", material: "Wool-blend pile", origin: "Morocco", style: "Moroccan contemporary", sizes: ["5 × 7 ft", "6 × 9 ft", "8 × 10 ft"], care: "Vacuum gently and rotate every three months for even wear.", inventory: 8, featured: true },
  { id: 3, slug: "vintage-medallion-rug", name: "Vintage Medallion Rug", category: "Vintage", price: 179.99, image: images.vintage, gallery: [images.vintage, detailImages[1], images.rose], description: "A softly distressed medallion composition with the collected feel of a well-loved heirloom.", material: "Low-pile polyester", origin: "Turkey", style: "Vintage traditional", sizes: ["5 × 7 ft", "7 × 9 ft", "8 × 10 ft"], care: "Spot clean with mild detergent. Professional cleaning recommended for deep stains.", inventory: 5, featured: true },
  { id: 4, slug: "soft-shag-runner", name: "Soft Shag Runner", category: "Runners", price: 79.99, oldPrice: 99.99, image: images.runner, gallery: [images.runner, images.shag, detailImages[0]], description: "A plush hallway runner that adds warmth, softness, and an easy layer of texture.", material: "High-pile polypropylene", origin: "Belgium", style: "Soft minimal", sizes: ["2 × 6 ft", "2 × 8 ft", "2 × 10 ft"], care: "Shake out regularly and vacuum on the lowest setting.", inventory: 18, featured: true },
  { id: 5, slug: "atlas-cream-shag", name: "Atlas Cream Shag", category: "Shag", price: 119.99, image: images.shag, gallery: [images.shag, detailImages[0], images.cloud], description: "Deep cream pile and subtle linear detail create an inviting surface for bedrooms and lounges.", material: "Plush polypropylene", origin: "Morocco", style: "Organic modern", sizes: ["4 × 6 ft", "5 × 7 ft", "6 × 9 ft"], care: "Vacuum using suction only. Trim loose fibers instead of pulling them.", inventory: 10, newArrival: true },
  { id: 6, slug: "terracotta-passage-runner", name: "Terracotta Passage Runner", category: "Runners", price: 89.99, image: images.passage, gallery: [images.passage, images.runner, detailImages[1]], description: "A warm terracotta runner designed to bring energy and practical comfort to narrow spaces.", material: "Cotton and polyester flatweave", origin: "India", style: "Warm contemporary", sizes: ["2 × 6 ft", "2 × 8 ft", "2 × 10 ft"], care: "Vacuum regularly. Use a rug pad to reduce movement and extend wear.", inventory: 7, newArrival: true },
  { id: 7, slug: "heritage-faded-rose-rug", name: "Heritage Faded Rose Rug", category: "Vintage", price: 189.99, image: images.rose, gallery: [images.rose, images.vintage, detailImages[0]], description: "Muted rose, sand, and charcoal tones give this distressed rug an easy, collected presence.", material: "Recycled polyester", origin: "Turkey", style: "Faded heritage", sizes: ["5 × 7 ft", "6 × 9 ft", "8 × 10 ft"], care: "Blot spills promptly and rotate periodically. Professional clean when required.", inventory: 3 },
  { id: 8, slug: "cloud-high-pile-rug", name: "Cloud High-Pile Rug", category: "Shag", price: 139.99, oldPrice: 159.99, image: images.cloud, gallery: [images.cloud, images.shag, detailImages[1]], description: "A dense, cloud-soft pile that makes reading corners, nurseries, and bedrooms feel instantly warmer.", material: "Microfiber polyester", origin: "Belgium", style: "Cozy minimal", sizes: ["4 × 6 ft", "5 × 7 ft", "6 × 9 ft"], care: "Vacuum on low suction. Spot clean only and allow to air dry completely.", inventory: 6 },
];

export const CATEGORY_SLUGS: Record<string, Product["category"]> = {
  "area-rugs": "Area rugs",
  runners: "Runners",
  shag: "Shag",
  vintage: "Vintage",
};

export const money = (amount: number) => `$${amount.toFixed(2)} USD`;
export const getProduct = (slug: string) => PRODUCTS.find((product) => product.slug === slug);
export const relatedProducts = (product: Product) => PRODUCTS.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
