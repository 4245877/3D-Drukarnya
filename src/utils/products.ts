import type { z } from 'zod';
import {
  productSchema,
  productVariantSchema,
  validateProductCollection,
} from '../data/product.schema.mjs';

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

const products = [...validatedProducts].sort((a, b) =>
  a.title.localeCompare(b.title, 'uk-UA'),
);

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
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
