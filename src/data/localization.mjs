import { CATEGORIES } from './categories.mjs';
import { RUSSIAN_CATEGORIES } from './categories.ru.mjs';
import { RUSSIAN_PRODUCTS, RUSSIAN_WARNINGS, RUSSIAN_IMAGE_NOTICES } from './products.ru.mjs';

/** Validate coverage before a new SKU/category can advertise a translation.
 * @param {{sku: string, publicationStatus?: string, safetyWarnings?: {text: string}[], imageNotice?: string}[]} products
 * @returns {string[]}
 */
export function validateRussianCopy(products) {
  const errors = [];
  const skus = new Set(products.map((product) => product.sku));
  for (const product of products.filter((product) => product.publicationStatus !== 'draft')) {
    const copy = RUSSIAN_PRODUCTS[product.sku];
    for (const field of ['title', 'summary', 'details', 'scope']) {
      if (typeof copy?.[field] !== 'string' || !copy[field].trim()) errors.push(`${product.sku}: missing Russian ${field}`);
    }
    const warnings = RUSSIAN_WARNINGS[product.sku] ?? [];
    if (product.imageNotice && !RUSSIAN_IMAGE_NOTICES[product.sku]?.trim()) errors.push(`${product.sku}: missing Russian image notice`);
    if (warnings.length !== (product.safetyWarnings?.length ?? 0)) errors.push(`${product.sku}: Russian safety warning coverage mismatch`);
    for (const warning of warnings) {
      if (!warning.title.trim() || !warning.text.trim()) errors.push(`${product.sku}: empty Russian safety warning`);
    }
  }
  for (const sku of Object.keys(RUSSIAN_PRODUCTS)) {
    if (!skus.has(sku)) errors.push(`${sku}: Russian copy refers to a missing product`);
  }
  for (const category of CATEGORIES) {
    const copy = RUSSIAN_CATEGORIES[category.slug];
    if (!copy?.label || !copy.title || !copy.description || !copy.lead || !copy.body?.length || !copy.faq?.length) errors.push(`${category.slug}: incomplete Russian category`);
  }
  for (const slug of Object.keys(RUSSIAN_CATEGORIES)) {
    if (!CATEGORIES.some((category) => category.slug === slug)) errors.push(`${slug}: Russian category has no original`);
  }
  return errors;
}
