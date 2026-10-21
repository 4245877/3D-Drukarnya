import { ORGANIZATION_ID } from './schema.mjs';

/**
 * An exact price or the price of a documented, measured base configuration
 * can describe one Offer. Estimates and unpriced alternatives cannot.
 * AggregateOffer is not Google's representation of product variants:
 * https://developers.google.com/search/docs/appearance/structured-data/product-snippet
 *
 * @param {{price: number, priceType?: string, publishOffer?: boolean, weightGrams?: number, priceNote?: string, availability?: string}} product
 * @param {{url: string, description?: string, name?: string}} options
 * @returns {Record<string, unknown> | undefined}
 */
export function buildProductOffer(product, {url, description, name}) {
  if (product.publishOffer === false) return undefined;
  if (product.priceType === 'from' && (product.weightGrams === undefined || !product.priceNote)) return undefined;
  // MadeToOrder is valid schema.org, but is not among the values documented
  // for Google product snippets. Keep the true status visible on the page;
  // do not substitute InStock/PreOrder for custom manufacturing.
  const availability = {
    in_stock: 'https://schema.org/InStock',
    unavailable: 'https://schema.org/OutOfStock',
  }[product.availability ?? 'unconfirmed'];
  return {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'UAH',
    url,
    ...(name ? {name} : {}),
    ...(description ? {description} : {}),
    ...(availability ? {availability} : {}),
    itemCondition: 'https://schema.org/NewCondition',
    eligibleRegion: {'@type': 'Country', name: 'UA'},
    seller: {'@id': ORGANIZATION_ID},
    // No priceValidUntil without a real, published expiry date.
  };
}
