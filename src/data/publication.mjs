/** Rights statuses are informational; publication is an explicit decision. */
/** @param {{ publicationStatus?: string }} product */
export function isPublishedProduct(product) {
  return product.publicationStatus !== 'draft';
}

/** Include drafts only when the caller explicitly requests a private preview. */
/**
 * @template {{ publicationStatus?: string }} T
 * @param {T[]} products
 * @param {boolean} [includeDrafts]
 * @returns {T[]}
 */
export function selectCatalogProducts(products, includeDrafts = false) {
  return products.filter((product) => includeDrafts || isPublishedProduct(product));
}
