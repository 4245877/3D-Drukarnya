// Data-contract tests: the real product JSON files must satisfy the shared
// schema, and the schema must actually reject broken input.
// Runner: built-in node:test (`npm test`), no extra dependencies.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  SLUG_PATTERN,
  isSafeSlug,
  normalizeSlug,
  productSchema,
  validateProductCollection,
} from '../src/data/product.schema.mjs';

const productsDir = fileURLToPath(new URL('../src/data/products/', import.meta.url));

async function loadEntries() {
  const fileNames = (await readdir(productsDir))
    .filter((name) => name.endsWith('.json'))
    .sort();

  return Promise.all(
    fileNames.map(async (fileName) => ({
      source: fileName,
      data: JSON.parse(await readFile(path.join(productsDir, fileName), 'utf8')),
    })),
  );
}

/** A minimal product that passes the schema; tests override single fields. */
const validProduct = {
  slug: 'test-product',
  title: 'Test product',
  shortDescription: 'Short description.',
  description: 'Long description.',
  price: 100,
  images: ['https://example.com/image.webp'],
};

test('every product JSON file passes the schema and collection rules', async () => {
  const entries = await loadEntries();

  assert.ok(entries.length > 0, 'expected at least one product JSON file');

  const { products, errors } = validateProductCollection(entries);

  assert.deepEqual(errors, []);
  assert.equal(products.length, entries.length);
});

test('slugs are unique and never become empty after normalization', async () => {
  const entries = await loadEntries();
  const slugs = entries.map(({ data }) => data.slug);

  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slugs found');

  for (const slug of slugs) {
    const normalized = normalizeSlug(slug);
    assert.notEqual(normalized, '', `slug "${slug}" normalizes to an empty string`);
    assert.ok(isSafeSlug(normalized), `slug "${slug}" fails ${SLUG_PATTERN}`);
  }
});

test('titles are unique', async () => {
  const entries = await loadEntries();
  const titles = entries.map(({ data }) => String(data.title).toLowerCase());

  assert.equal(new Set(titles).size, titles.length, 'duplicate titles found');
});

test('prices are finite positive numbers', async () => {
  for (const { source, data } of await loadEntries()) {
    assert.equal(typeof data.price, 'number', `${source}: price is not a number`);
    assert.ok(
      Number.isFinite(data.price) && data.price > 0,
      `${source}: price ${data.price} is not a finite positive number`,
    );
  }
});

test('every product has a non-empty image list within URL restrictions', async () => {
  for (const { source, data } of await loadEntries()) {
    assert.ok(Array.isArray(data.images), `${source}: images is not an array`);
    assert.ok(data.images.length > 0, `${source}: images array is empty`);

    for (const image of data.images) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(image)) {
        const url = new URL(image); // throws on malformed URLs
        assert.equal(url.protocol, 'https:', `${source}: non-https image ${image}`);
      } else {
        assert.ok(!image.includes('..'), `${source}: unsafe local path ${image}`);
      }
    }
  }
});

test('the schema rejects broken products', () => {
  const rejects = (patch, field) => {
    const result = productSchema.safeParse({ ...validProduct, ...patch });
    assert.equal(result.success, false, `expected rejection for ${field}`);
  };

  rejects({ slug: '' }, 'empty slug');
  rejects({ slug: '///' }, 'slug of slashes only');
  rejects({ slug: 'UPPER-Case' }, 'uppercase slug');
  rejects({ slug: 'a b' }, 'slug with spaces');
  rejects({ title: '   ' }, 'blank title');
  rejects({ shortDescription: '' }, 'empty shortDescription');
  rejects({ description: undefined }, 'missing description');
  rejects({ price: 0 }, 'zero price');
  rejects({ price: -10 }, 'negative price');
  rejects({ price: Number.POSITIVE_INFINITY }, 'infinite price');
  rejects({ price: '100' }, 'string price');
  rejects({ images: [] }, 'empty images array');
  rejects({ images: ['javascript:alert(1)'] }, 'javascript: image');
  rejects({ images: ['data:image/png;base64,AAAA'] }, 'data: image');
  rejects({ images: ['http://example.com/i.png'] }, 'plain-http image');
  rejects({ images: ['../secret.png'] }, 'path traversal image');
  rejects({ pirce: 100 }, 'unknown key (typo of price)');
  rejects({ variants: [] }, 'empty variants array');
  rejects({ variants: [{ name: 'A' }] }, 'variant without description');
  rejects({ variants: [{ name: 'A', description: 'B', extra: true }] }, 'variant with unknown key');
});

test('the collection check rejects duplicate slugs and titles', () => {
  const { errors } = validateProductCollection([
    { source: 'one.json', data: { ...validProduct } },
    { source: 'two.json', data: { ...validProduct, title: 'Other title' } },
    { source: 'three.json', data: { ...validProduct, slug: 'other-slug' } },
  ]);

  assert.ok(
    errors.some((error) => error.includes('two.json') && error.includes('slug')),
    `expected a duplicate-slug error, got: ${errors.join('; ')}`,
  );
  assert.ok(
    errors.some((error) => error.includes('three.json') && error.includes('title')),
    `expected a duplicate-title error, got: ${errors.join('; ')}`,
  );
});

test('normalizeSlug flattens slash padding, isSafeSlug rejects the leftovers', () => {
  assert.equal(normalizeSlug('///'), '');
  assert.equal(normalizeSlug('  /product-slug/  '), 'product-slug');
  assert.equal(normalizeSlug(42), '');
  assert.equal(isSafeSlug(''), false);
  assert.equal(isSafeSlug('product-slug'), true);
  assert.equal(isSafeSlug('a/../b'), false);
});
