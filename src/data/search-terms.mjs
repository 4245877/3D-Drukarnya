import { RUSSIAN_CATEGORIES } from './categories.ru.mjs';
import { RUSSIAN_PRODUCTS } from './products.ru.mjs';

// Retain relevant terms from the retired pages without advertising translations
// or changing the Ukrainian titles, descriptions and visible product details.
// Google ignores meta keywords: these aliases are retained for other consumers,
// not as a substitute for content, canonical URLs or permanent redirects.
const CATEGORY_TERMS = {
  '10-inch-server-rack': ['10 inch server rack', 'mini rack', 'HomeLab rack'],
  'cases-and-storage': ['NAS case', 'NAS enclosure', 'HDD hot swap module'],
  'equipment-mounts': ['rack mount', 'mini PC mount', 'Raspberry Pi mount'],
  'rack-accessories': ['rack shelf', 'Keystone patch panel', 'cable organizer'],
};

const CATALOG_TERMS = [
  '10 inch server rack Ukraine', 'NAS case Ukraine', 'HomeLab mounts',
  'серверная стойка 10 дюймов', 'корпус NAS', 'крепления для HomeLab',
];

/** Page-specific aliases only; unrelated pages keep their existing keywords.
 * @param {string} path Canonical path without the deployment base.
 * @param {{sku: string, slug: string}[]} products
 * @returns {string[]}
 */
export function getSearchTerms(path, products = []) {
  if (path === '/' || path === '/catalog/') return CATALOG_TERMS;
  const categorySlug = path.match(/^\/catalog\/([^/]+)\/$/)?.[1];
  if (categorySlug) return [
    RUSSIAN_CATEGORIES[categorySlug]?.title,
    ...(CATEGORY_TERMS[categorySlug] ?? []),
  ].filter(Boolean);

  const productSlug = path.match(/^\/products\/([^/]+)\/$/)?.[1];
  const product = productSlug ? products.find(({ slug }) => slug === productSlug) : undefined;
  if (!product) return [];
  const title = RUSSIAN_PRODUCTS[product.sku]?.title;
  return title ? [title] : [];
}
