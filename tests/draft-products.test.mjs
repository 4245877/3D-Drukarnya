import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { productSchema } from '../src/data/product.schema.mjs';
import { selectCatalogProducts } from '../src/data/publication.mjs';
import { computeCatalogPrice } from '../src/data/pricing.config.mjs';

const productsDirectory = new URL('../src/data/products/', import.meta.url);
const loadProducts = async () => Promise.all((await readdir(productsDirectory))
  .filter((name) => name.endsWith('.json'))
  .map(async (name) => JSON.parse(await readFile(new URL(name, productsDirectory), 'utf8'))));

test('ten additions are public with approved rights and honest preliminary prices', async () => {
  const all = await loadProducts();
  const additions = all.filter((product) => Number(product.sku.slice(1)) >= 40);
  const prices = { P40: 329, P41: 499, P42: 199, P43: 249, P44: 329,
    P45: 279, P46: 349, P47: 599, P48: 849, P49: 899 };
  assert.equal(additions.length, 10);
  assert.equal(all.filter((product) => product.publicationStatus === 'draft').length, 0);
  assert.equal(selectCatalogProducts(all).length, 49);
  assert.equal(selectCatalogProducts(all, true).length, 49);
  for (const product of additions) {
    assert.equal(product.publicationStatus, 'published', product.sku);
    assert.equal(product.commercialRightsStatus, 'approved', product.sku);
    assert.equal(product.photoRightsStatus, 'approved', product.sku);
    assert.equal(product.price, prices[product.sku], product.sku);
    assert.equal(product.priceType, 'from', product.sku);
    assert.equal(product.weightGrams, undefined, product.sku);
    assert.equal(product.pricingProfile, undefined, product.sku);
    assert.equal(computeCatalogPrice(product), undefined, 'guide price is not a fabricated weight');
    assert.equal(product.publishOffer, false, product.sku);
    assert.equal(product.availability, 'unconfirmed', product.sku);
    assert.equal(product.orderUrl, undefined, product.sku);
    assert.equal(product.draftReasons, undefined, product.sku);
    assert.ok(product.imageNotice, product.sku);
    assert.ok(product.sourceUrl, product.sku);
    assert.ok(product.author, product.sku);
    assert.ok(product.license, product.sku);
  }
});

test('future draft schema prevents offers, shipping promises and publication without a weight', async () => {
  const product = (await loadProducts()).find((product) => product.sku === 'P40');
  const draft = {
    ...product,
    sku: 'P999',
    publicationStatus: 'draft',
    draftReasons: ['Production checks are pending.'],
  };
  assert.equal(productSchema.safeParse(draft).success, true);
  for (const patch of [
    { publishOffer: true }, { availability: 'in_stock' }, { availability: 'made_to_order' },
    { orderUrl: 'https://www.olx.ua/' }, { draftReasons: [] }, { draftReasons: undefined },
    { publicationStatus: 'published' },
  ]) {
    assert.equal(productSchema.safeParse({ ...draft, ...patch }).success, false, JSON.stringify(patch));
  }
});

test('rights review does not hide existing products; publication is explicit', () => {
  const published = { sku: 'P1', commercialRightsStatus: 'permission_required' };
  const draft = { sku: 'P40', publicationStatus: 'draft', commercialRightsStatus: 'approved' };
  assert.deepEqual(selectCatalogProducts([published, draft]), [published]);
  assert.deepEqual(selectCatalogProducts([published, draft], true), [published, draft]);
});
