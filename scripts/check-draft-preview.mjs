// Exercise Astro's actual private preview over HTTP; no browser is required.
import assert from 'node:assert/strict';
import { dev } from 'astro';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../src/data/categories.mjs';
import { SITE_ORIGIN, BASE_PATH } from '../src/data/site.config.mjs';

const root = new URL('../', import.meta.url);
const directory = new URL('src/data/products/', root);
const products = await Promise.all((await readdir(directory)).filter((name) => name.endsWith('.json'))
  .map(async (name) => JSON.parse(await readFile(new URL(name, directory), 'utf8'))));
const drafts = products.filter((product) => product.publicationStatus === 'draft');
process.env.PUBLIC_CATALOG_PREVIEW_DRAFTS = '1';
const server = await dev({
  root: fileURLToPath(root),
  server: { host: '127.0.0.1', port: 4323 },
  vite: { server: { strictPort: true } },
});
const base = `http://127.0.0.1:${server.address.port}${BASE_PATH}`;
const get = async (path = '') => {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, path);
  return response.text();
};
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

try {
  const catalog = await get();
  assert.equal([...catalog.matchAll(/data-product-sku="P\d+"/g)].length, 49);
  assert.match(catalog, /name="robots" content="noindex/);
  const sitemap = await get('sitemap.xml');
  for (const draft of drafts) {
    assert.ok(catalog.includes(`data-product-sku="${draft.sku}"`), draft.sku);
    assert.ok(!sitemap.includes(`products/${draft.slug}/`), draft.sku);
    const html = await get(`products/${draft.slug}/`);
    assert.match(html, /name="robots" content="noindex/);
    assert.ok(html.includes('Чернетка · продаж ще не відкрито'), draft.sku);
    assert.ok(html.includes('Орієнтовна ціна'), draft.sku);
    assert.ok(!html.includes('data-order-cta'), draft.sku);
    assert.ok(!/<a[^>]*class="[^"]*product-recap__button/.test(html), draft.sku);
    assert.ok(!/<a[^>]*class="[^"]*product-buybar__button/.test(html), draft.sku);
    const ld = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .flatMap((match) => JSON.parse(match[1])['@graph'] ?? []);
    const node = ld.find((item) => item['@type'] === 'Product');
    assert.ok(node, draft.sku);
    assert.equal(node.offers, undefined, draft.sku);
    assert.equal(node.weight, undefined, draft.sku);
    assert.equal(node.image.length, draft.images.length, draft.sku);
    for (const image of draft.images) {
      assert.ok(html.includes(escape(image)), `${draft.sku}: missing gallery image ${image}`);
    }
    if (draft.images.length > 1) {
      assert.equal([...html.matchAll(/data-gallery-thumb(?:\s|>)/g)].length, draft.images.length, draft.sku);
    }
    const main = html.match(/<img[^>]*src="([^"]+)"[^>]*data-gallery-main-image/);
    assert.ok(main, `${draft.sku}: no cover`);
    const expectedCover = draft.images[0].startsWith('https:') ? draft.images[0] :
      `${SITE_ORIGIN}${BASE_PATH}${draft.images[0].replace(/^\/+/, '')}`;
    assert.equal(main[1], escape(expectedCover), `${draft.sku}: cover order`);
  }
  for (const category of CATEGORIES) {
    const html = await get(`catalog/${category.slug}/`);
    const items = products.filter((product) => product.category === category.name);
    for (const item of items) assert.ok(html.includes(`products/${item.slug}/`), `${category.slug}: ${item.sku}`);
  }
  console.log(`OK: 49 preview cards, ${drafts.length} draft pages, four categories, covers and gallery order; no offers/order buttons or draft sitemap entries.`);
} finally {
  await server.stop();
}
