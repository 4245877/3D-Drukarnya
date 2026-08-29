import type { z } from 'zod';
import {
  CATALOG_CATEGORIES,
  productSchema,
  productVariantSchema,
  validateProductCollection,
} from '../data/product.schema.mjs';

export { CATALOG_CATEGORIES };

// The schema (src/data/product.schema.mjs) is the single source of truth for
// the product data contract; the TypeScript types are derived from it.
export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;

const productModules = import.meta.glob('../data/products/*.json', {
  eager: true,
}) as Record<string, { default: unknown }>;

const entries = Object.entries(productModules).map(([modulePath, module]) => ({
  source: modulePath.split('/').pop() ?? modulePath,
  data: module.default,
}));

const { products: validatedProducts, errors } = validateProductCollection(entries);

// Runtime validation at module load: any schema or uniqueness violation
// aborts `astro build` / `astro dev` instead of shipping broken pages.
if (errors.length > 0) {
  throw new Error(
    `Product data validation failed (${errors.length} error(s)):\n${errors
      .map((error) => `  ${error}`)
      .join('\n')}`,
  );
}

/**
 * Catalog order is controlled entirely by product data. Equal priorities use
 * the numeric part of the stable P-prefixed SKU as a deterministic fallback.
 * Rights-review and featured metadata intentionally do not affect this order.
 */
export function compareProductsByMerchandising(a: Product, b: Product): number {
  const priorityDifference = b.merchandisingPriority - a.merchandisingPriority;
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const aSkuNumber = Number.parseInt(a.sku.slice(1), 10);
  const bSkuNumber = Number.parseInt(b.sku.slice(1), 10);
  return aSkuNumber - bSkuNumber;
}

const products = [...validatedProducts].sort(compareProductsByMerchandising);

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

/**
 * Lookup by the stable catalog SKU. Guides and landing pages reference
 * products by SKU rather than by slug, so a renamed slug can never leave a
 * broken link behind — an unknown SKU fails the build instead.
 */
export function getProductBySku(sku: string): Product | undefined {
  return products.find((product) => product.sku === sku);
}

/**
 * Products filed under one catalog category, in catalog (merchandising)
 * order. Backs the category landing pages and their ItemList JSON-LD.
 */
export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.category === category);
}

/**
 * Suggestions shown at the bottom of a product page. Same category first
 * (that is the strongest real relation in the data), then the rest of the
 * catalog in merchandising order, so the block is never empty for a
 * one-product category. Products of the same `familyId` are the closest
 * match of all and come first; the product itself is always excluded.
 */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const rank = (candidate: Product): number => {
    if (product.familyId && candidate.familyId === product.familyId) return 0;
    if (candidate.category === product.category) return 1;
    return 2;
  };

  return products
    .filter((candidate) => candidate.sku !== product.sku)
    .map((candidate, index) => ({ candidate, index, rank: rank(candidate) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat('uk-UA').format(price)} ₴`;
}

export function withBase(path: string | undefined): string {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}
