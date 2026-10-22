import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { CATEGORIES } from '../src/data/categories.mjs';
import { LANGUAGE_REDIRECTS } from '../src/data/language-redirects.mjs';
import { SITE_REDIRECTS } from '../src/data/category-redirects.mjs';
import { STATIC_ROUTE_PATHS } from '../src/data/routes.mjs';
import { getSearchTerms } from '../src/data/search-terms.mjs';

const directory = new URL('../src/data/products/', import.meta.url);
const products = await Promise.all((await readdir(directory))
  .filter((name) => name.endsWith('.json'))
  .map(async (name) => JSON.parse(await readFile(new URL(name, directory), 'utf8'))));
const published = products.filter((product) => product.publicationStatus !== 'draft');

test('all 56 former language URLs go directly to their primary-language equivalent', () => {
  const expected = {
    '/en/': '/', '/ru/': '/', '/ru/catalog/': '/catalog/',
    ...Object.fromEntries(CATEGORIES.map(({slug}) => [`/ru/catalog/${slug}/`, `/catalog/${slug}/`])),
    ...Object.fromEntries(published.map(({slug}) => [`/ru/products/${slug}/`, `/products/${slug}/`])),
  };
  assert.equal(Object.keys(expected).length, 56);
  assert.deepEqual(LANGUAGE_REDIRECTS, expected);
  for (const [from, to] of Object.entries(expected)) {
    assert.equal(SITE_REDIRECTS[from], to);
    assert.ok(!Object.hasOwn(SITE_REDIRECTS, to), `${from} creates a redirect chain`);
    assert.ok(!STATIC_ROUTE_PATHS.includes(from.slice(1)), `${from} is still indexable`);
  }
});

test('retired search terms stay relevant to the primary page and translations are optional', () => {
  assert.ok(getSearchTerms('/').includes('10 inch server rack Ukraine'));
  assert.ok(getSearchTerms('/').includes('серверная стойка 10 дюймов'));
  for (const category of CATEGORIES) {
    assert.ok(getSearchTerms(`/catalog/${category.slug}/`).length >= 2);
  }
  for (const product of published) {
    const terms = getSearchTerms(`/products/${product.slug}/`, products);
    assert.equal(terms.length, 1, `${product.sku} lost its archived product name`);
    assert.ok(terms[0].length > 10);
  }
  // Publishing new Ukrainian content must not require a new Russian version.
  assert.deepEqual(getSearchTerms('/products/new-product/', [{sku: 'P999', slug: 'new-product'}]), []);
  for (const path of ['/sla/', '/guides/homelab-starter-rack/', '/404/']) {
    assert.deepEqual(getSearchTerms(path, products), []);
  }
});
