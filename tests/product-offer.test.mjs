import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProductOffer } from '../src/utils/product-offer.mjs';

const options = {url: 'https://example.com/product/', name: 'Base version', description: 'Printed parts only'};
test('a measured, documented base configuration has its own exact Offer', () => {
  const offer = buildProductOffer({price: 198, priceType: 'from', weightGrams: 79, priceNote: 'Base panel', availability: 'made_to_order'}, options);
  assert.equal(offer['@type'], 'Offer');
  assert.equal(offer.price, 198);
  assert.equal(offer.description, options.description);
  assert.equal(offer.availability, undefined, 'custom manufacturing must not be marked as stock');
  assert.equal(offer.priceValidUntil, undefined, 'build time is not a commercial expiry date');
  assert.equal(offer.lowPrice, undefined, 'variants must not be modelled as AggregateOffer');
});
test('provisional starting prices and disabled offers are not exact structured prices', () => {
  assert.equal(buildProductOffer({price: 500, priceType: 'from'}, options), undefined);
  assert.equal(buildProductOffer({price: 500, priceType: 'from', weightGrams: 200}, options), undefined);
  assert.equal(buildProductOffer({price: 500, publishOffer: false}, options), undefined);
});
test('exact prices retain confirmed stock status and never invent an expiry', () => {
  const offer = buildProductOffer({price: 500, priceType: 'exact', availability: 'in_stock'}, options);
  assert.equal(offer.price, 500);
  assert.equal(offer.availability, 'https://schema.org/InStock');
  assert.equal(offer.priceValidUntil, undefined);
});
