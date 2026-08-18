// Single source of truth for weight-based catalog pricing.
//
// Every product stores the printed weight of its parts in grams
// (`weightGrams`, see src/data/product.schema.mjs); the published price is
// always that weight multiplied by the rate below. Nothing else in the
// catalog is allowed to set a price by hand — the schema rejects any product
// whose `price` drifts away from the formula.
//
// To change the rate:
//   1. edit PRICE_PER_GRAM_UAH below (e.g. 2.5 -> 3);
//   2. run `npm run prices:recalculate` to rewrite every product's `price`.
//
// Plain ESM (.mjs) for the same reason as the schema: the site build
// (bundled by Vite), the standalone scripts and the tests all import it, so
// the rate is never duplicated.

/**
 * Catalog-wide print rate, in UAH per gram of finished product.
 * This is the only place the number lives.
 */
export const PRICE_PER_GRAM_UAH = 2.5;

/** Currency of PRICE_PER_GRAM_UAH and of every computed price. */
export const PRICE_CURRENCY = 'UAH';

/**
 * The catalog price of a product: weight × rate.
 *
 * Rounded to whole hryvnia on purpose. Prices are rendered with
 * `Intl.NumberFormat('uk-UA')` and republished as a JSON-LD offer, and
 * scripts/check-build.mjs compares the digits of the rendered price against
 * the stored number — keeping prices integral keeps all three in agreement.
 *
 * @param {number} weightGrams Printed weight of the product, in grams.
 * @param {number} [pricePerGram] Rate override; defaults to the catalog rate.
 * @returns {number} Price in UAH, rounded to the nearest hryvnia.
 */
export function computePriceFromWeight(weightGrams, pricePerGram = PRICE_PER_GRAM_UAH) {
  return Math.round(weightGrams * pricePerGram);
}
