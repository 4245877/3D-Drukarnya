import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { computeCatalogPrice, REVIEWED_PRICING_SKUS } from '../src/data/pricing.config.mjs';
import { productSchema } from '../src/data/product.schema.mjs';

const load = async (sku) => JSON.parse(await readFile(
  new URL(`../src/data/products/product-${sku.slice(1)}.json`, import.meta.url), 'utf8',
));

test('all ten audited prices are calculated, without inventing target weights', async () => {
  assert.equal(REVIEWED_PRICING_SKUS.size, 10);
  for (const sku of REVIEWED_PRICING_SKUS) {
    const product = await load(sku);
    assert.ok(product.pricingProfile, sku);
    assert.equal(product.weightGrams, undefined, `${sku}: benchmark is not a physical weight`);
    assert.equal(product.priceType, 'from', sku);
    assert.equal(product.price, computeCatalogPrice(product), sku);
    assert.equal(productSchema.safeParse(product).success, true, sku);
  }
});

test('equivalent mini-PC mounts share a price; empty Keystone sockets add no premium', async () => {
  const reference = await load('P27');
  for (const sku of ['P26', 'P28', 'P29']) {
    assert.equal((await load(sku)).price, reference.price, sku);
  }
  assert.equal((await load('P22')).price, (await load('P23')).price);
  assert.equal((await load('P21')).price, reference.price + 100,
    'parametric work must remain separate from standard manufacturing');
});

test('known weight replaces a benchmark and rate changes reach pending products', async () => {
  const product = await load('P26');
  assert.equal(computeCatalogPrice({ ...product, weightGrams: 120 }), 300);
  assert.equal(computeCatalogPrice(product, 3), 669);
  const absMount = await load('P22');
  assert.equal(computeCatalogPrice({ ...absMount, weightGrams: 100 }), 300,
    'measured weight replaces the reference; the ABS preparation allowance remains');
});

test('schema rejects stale, exact, missing and inappropriate benchmark pricing', async () => {
  const product = await load('P26');
  for (const patch of [
    { price: 850 },
    { priceType: 'exact' },
    { pricingProfile: undefined },
    { pricingProfile: 'arbitrary-discount' },
    { pricingProfile: 'cable-panel' },
    { category: 'Корпуси та дискові модулі' },
    { weightGrams: -1 },
  ]) {
    assert.equal(productSchema.safeParse({ ...product, ...patch }).success, false,
      JSON.stringify(patch));
  }
  const measured = { ...product, weightGrams: 120, price: 300 };
  assert.equal(productSchema.safeParse(measured).success, true);
  assert.equal(productSchema.safeParse({ ...measured, pricingProfile: undefined }).success, true);
});
