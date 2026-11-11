import { defaultDatabase, type Database } from "@/data/database";

const STORAGE_KEY = "axd_db_v2";


export function normalizeDatabase(raw: unknown): Database {
  if (!raw || typeof raw !== "object") return defaultDatabase;
  const parsed = raw as Partial<Database>;
  const site = {
    ...defaultDatabase.site,
    ...(parsed.site || {}),
    hero: { ...defaultDatabase.site.hero, ...(parsed.site?.hero || {}) },
    footer: { ...defaultDatabase.site.footer, ...(parsed.site?.footer || {}) },
    seo: { ...defaultDatabase.site.seo, ...(parsed.site?.seo || {}) },
    trust: parsed.site?.trust?.length ? parsed.site.trust : defaultDatabase.site.trust,
  };
  return {
    ...defaultDatabase,
    ...parsed,
    site,
    categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : defaultDatabase.categories,
    products: Array.isArray(parsed.products)
      ? parsed.products.map((p) => ({ ...p, gallery: Array.isArray(p.gallery) ? p.gallery : [], tags: Array.isArray(p.tags) ? p.tags : [] }))
      : defaultDatabase.products,
  } as Database;
}

// The catalog is NOT stored in localStorage. The live copy comes from
// src/data/database.ts (published to GitHub from the admin panel).
let activeDatabase: Database = defaultDatabase;

export function setActiveDatabase(db: Database) {
  activeDatabase = db;
}

export function loadDatabase(): Database {
  return activeDatabase;
}

export function saveDatabase(db: Database) {
  activeDatabase = db;
  return db;
}

export function resetDatabase() {
  activeDatabase = defaultDatabase;
  return defaultDatabase;
}

/** Remove any stale catalog copy left in the browser by older versions. */
export function clearLegacyLocalDatabase() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// WhatsApp link helper with full clicked-product context (English only)
export function whatsappLink(
  productTitle: string,
  price: number,
  phone: string,
  category?: string,
  opts?: { id?: string; oldPrice?: number; deliveryTime?: string; slug?: string }
) {
  const siteName = loadDatabase().site.name;
  const disc = discountPercent(price, opts?.oldPrice);
  const priceLine =
    disc > 0 && opts?.oldPrice
      ? `Rs. ${price.toLocaleString("en-PK")} (${disc}% OFF — Regular Rs. ${opts.oldPrice.toLocaleString("en-PK")})`
      : `Rs. ${price.toLocaleString("en-PK")}`;

  const lines = [
    `Hello ${siteName}!`,
    ``,
    `I clicked on the following service and would like to order:`,
    `• Product: *${productTitle}*`,
    category ? `• Category: ${category}` : null,
    `• Price: ${priceLine}`,
    opts?.deliveryTime ? `• Estimated Delivery: ${opts.deliveryTime}` : null,
    opts?.id || opts?.slug ? `• Service ID: ${opts.slug || opts.id}` : null,
    ``,
    `Please share payment details and onboarding steps. Thank you!`,
  ].filter((l) => l !== null);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// Discount calc
export function discountPercent(price: number, oldPrice?: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
