import { readdirSync, readFileSync } from 'node:fs';
import { CATEGORIES } from './categories.mjs';
import { isPublishedProduct } from './publication.mjs';

// Keep former language URLs available to crawlers and external links. Each
// address goes straight to its equivalent page, never through another redirect.
// Plain Node APIs also work when this module is loaded by astro.config.mjs.
const productsDirectory = new URL('./products/', import.meta.url);
const products = readdirSync(productsDirectory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => JSON.parse(readFileSync(new URL(name, productsDirectory), 'utf8')))
  .filter(isPublishedProduct);

export const LANGUAGE_REDIRECTS = {
  '/en/': '/',
  '/ru/': '/',
  '/ru/catalog/': '/catalog/',
  ...Object.fromEntries(CATEGORIES.map(({ slug }) => [
    `/ru/catalog/${slug}/`, `/catalog/${slug}/`,
  ])),
  ...Object.fromEntries(products.map(({ slug }) => [
    `/ru/products/${slug}/`, `/products/${slug}/`,
  ])),
};
