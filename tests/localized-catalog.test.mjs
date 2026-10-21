import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { validateRussianCopy } from '../src/data/localization.mjs';
import { getPageAlternates } from '../src/data/i18n.mjs';
import { RUSSIAN_PRODUCTS } from '../src/data/products.ru.mjs';
import { buildProductTitle } from '../src/utils/seo.mjs';

const directory = new URL('../src/data/products/', import.meta.url);
const products = await Promise.all((await readdir(directory)).filter((name) => name.endsWith('.json')).map(async (name) => JSON.parse(await readFile(new URL(name, directory), 'utf8'))));

test('published products have edited Russian copy, distinct titles and all safety warnings', () => {
  assert.deepEqual(validateRussianCopy(products), []);
  const titles = products.map((product) => buildProductTitle(RUSSIAN_PRODUCTS[product.sku].title));
  assert.equal(new Set(titles).size, titles.length, 'clipping loses distinguishing product information');
});

test('missing localization blocks publication, including a newly added safety warning', () => {
  const addedProduct = {...products[0], sku: 'P999'};
  assert.ok(validateRussianCopy([...products, addedProduct]).some((message) => message.includes('P999: missing Russian title')));
  const changed = products.map((product, index) => index === 0 ? {...product, safetyWarnings: [{text: 'New warning'}]} : product);
  assert.ok(validateRussianCopy(changed).some((message) => message.includes('safety warning coverage mismatch')));
});

test('localized product alternates are reciprocal and never point at an overview', () => {
  for (const product of products) {
    const path = `/products/${product.slug}/`;
    const alternates = getPageAlternates(path);
    assert.deepEqual(alternates, getPageAlternates(`/ru${path}`));
    assert.deepEqual(alternates, [{hreflang: 'uk', path}, {hreflang: 'ru', path: `/ru${path}`}, {hreflang: 'x-default', path}]);
  }
  assert.deepEqual(getPageAlternates('/guides/homelab-starter-rack/'), []);
  assert.deepEqual(getPageAlternates('/sla/'), []);
});
