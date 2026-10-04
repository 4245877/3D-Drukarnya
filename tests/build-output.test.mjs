// Build-output tests: run a real production build and assert that every
// product page is generated and the sitemap lists the expected URLs.
// Runner: built-in node:test (`npm test`).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { checkBuild } from '../scripts/check-build.mjs';
import { CATEGORIES } from '../src/data/categories.mjs';
import { CATEGORY_REDIRECTS } from '../src/data/category-redirects.mjs';
import { GUIDES } from '../src/data/guides.mjs';
import { STATIC_ROUTE_PATHS } from '../src/data/routes.mjs';
import { INDEXNOW_KEY } from '../src/data/site.config.mjs';
import { selectCatalogProducts } from '../src/data/publication.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(projectRoot, 'dist');
const productsDir = path.join(projectRoot, 'src', 'data', 'products');
const astroBin = path.join(projectRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');

// Must mirror astro.config.mjs (site + base + trailingSlash: 'always').
const SITE_BASE = 'https://4245877.github.io/3D-Drukarnya/';

async function loadProducts() {
  const fileNames = (await readdir(productsDir)).filter((name) =>
    name.endsWith('.json'),
  );

  return Promise.all(
    fileNames.map(async (fileName) => {
      const data = JSON.parse(
        await readFile(path.join(productsDir, fileName), 'utf8'),
      );
      return data;
    }),
  );
}

test('production build generates every product page and the sitemap', async (t) => {
  // One real build for the whole file; individual expectations are subtests.
  execFileSync(process.execPath, [astroBin, 'build'], {
    cwd: projectRoot,
    stdio: 'pipe',
    // A preview flag accidentally inherited by CI must not publish drafts.
    env: { ...process.env, PUBLIC_CATALOG_PREVIEW_DRAFTS: '1' },
    timeout: 10 * 60 * 1000,
  });

  const allProducts = await loadProducts();
  const products = selectCatalogProducts(allProducts);
  const slugs = products.map(({ slug }) => slug);
  assert.equal(products.length, 39, 'production build must contain all 39 products');

  await t.test('drafts never leak into production pages, catalogs, sitemap or photos', async () => {
    const catalog = await readFile(path.join(distDir, 'index.html'), 'utf8');
    const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
    const drafts = allProducts.filter((product) => product.publicationStatus === 'draft');
    assert.equal(drafts.length, 10);
    for (const draft of drafts) {
      await assert.rejects(access(path.join(distDir, 'products', draft.slug, 'index.html')));
      assert.ok(!catalog.includes(`data-product-sku="${draft.sku}"`), draft.sku);
      assert.ok(!sitemap.includes(`/products/${draft.slug}/`), draft.sku);
      for (const photo of draft.images.filter((image) => image.startsWith('https:'))) {
        assert.ok(!catalog.includes(photo), `${draft.sku}: unapproved photo leaked`);
      }
    }
  });

  await t.test('catalog page exists', async () => {
    await access(path.join(distDir, 'index.html'));
  });

  await t.test('catalog cards follow merchandising priority and curated first screen', async () => {
    const catalogHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
    const renderedSkus = Array.from(
      catalogHtml.matchAll(/data-product-sku="(P\d+)"/g),
      (match) => match[1],
    );
    const expectedSkus = [...products]
      .sort(
        (a, b) =>
          b.merchandisingPriority - a.merchandisingPriority ||
          Number.parseInt(a.sku.slice(1), 10) - Number.parseInt(b.sku.slice(1), 10),
      )
      .map(({ sku }) => sku);

    assert.deepEqual(renderedSkus, expectedSkus);
    assert.deepEqual(
      renderedSkus.slice(0, 8),
      ['P1', 'P3', 'P9', 'P21', 'P2', 'P10', 'P5', 'P12'],
    );
  });

  await t.test('catalog sidebar and mobile drawer keep their accessible DOM contract', async () => {
    const catalogHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');

    const openingTag = (tagName, markerAttribute) =>
      catalogHtml.match(
        new RegExp(
          `<${tagName}\\b[^>]*\\b${markerAttribute}(?=[\\s=>])[^>]*>`,
          'i',
        ),
      )?.[0] ?? '';
    const attribute = (tag, name) =>
      tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
    const hasAttribute = (tag, name) =>
      new RegExp(`\\s${name}(?=[\\s=>])`, 'i').test(tag);

    const sidebar = openingTag('aside', 'data-catalog-sidebar');
    assert.ok(sidebar, 'catalog sidebar is missing');
    assert.equal(attribute(sidebar, 'id'), 'catalog-sidebar');
    assert.equal(attribute(sidebar, 'aria-labelledby'), 'catalog-sidebar-title');
    assert.match(catalogHtml, /\bid="catalog-sidebar-title"/);

    const mobileTrigger = openingTag('button', 'data-catalog-sidebar-open');
    assert.ok(mobileTrigger, 'mobile catalog trigger is missing');
    assert.equal(attribute(mobileTrigger, 'aria-controls'), 'catalog-sidebar');
    assert.equal(attribute(mobileTrigger, 'aria-expanded'), 'false');

    const mobileToolbar = openingTag('div', 'data-catalog-mobile-toolbar');
    const backdrop = openingTag('button', 'data-catalog-sidebar-backdrop');
    const categoryNav = openingTag('nav', 'data-catalog-category-nav');
    assert.ok(mobileToolbar, 'mobile catalog toolbar is missing');
    assert.ok(backdrop, 'catalog drawer backdrop is missing');
    assert.ok(categoryNav, 'catalog filter navigation is missing');
    assert.ok(hasAttribute(mobileToolbar, 'hidden'), 'mobile toolbar must start hidden');
    assert.ok(hasAttribute(backdrop, 'hidden'), 'drawer backdrop must start hidden');
    assert.ok(hasAttribute(categoryNav, 'hidden'), 'filter navigation must start hidden');
    assert.ok(
      attribute(categoryNav, 'aria-label')?.trim() ||
        attribute(categoryNav, 'aria-labelledby')?.trim(),
      'catalog filter navigation needs an accessible name',
    );

    const filterButtons = Array.from(
      catalogHtml.matchAll(
        /<button\b(?=[^>]*\bdata-catalog-filter="[^"]*")[^>]*>/gi,
      ),
      (match) => match[0],
    ).map((tag) => ({
      filter: attribute(tag, 'data-catalog-filter'),
      pressed: attribute(tag, 'aria-pressed'),
      category: attribute(tag, 'data-catalog-category'),
      href: attribute(tag, 'data-catalog-href'),
    }));

    assert.equal(filterButtons.length, CATEGORIES.length + 2);
    assert.equal(filterButtons.filter(({ filter }) => filter === 'all').length, 1);
    assert.equal(filterButtons.filter(({ filter }) => filter === 'featured').length, 1);
    assert.equal(
      filterButtons.filter(({ filter }) => filter === 'category').length,
      CATEGORIES.length,
    );
    assert.deepEqual(
      filterButtons.filter(({ pressed }) => pressed === 'true').map(({ filter }) => filter),
      ['all'],
      'only the all-products filter may be pressed initially',
    );
    assert.ok(
      filterButtons.every(({ pressed, filter }) =>
        filter === 'all' ? pressed === 'true' : pressed === 'false',
      ),
      'every inactive catalog filter must publish aria-pressed="false"',
    );

    const renderedCategories = filterButtons
      .filter(({ filter }) => filter === 'category')
      .map(({ category, href }) => ({ category, href }));
    const expectedCategories = CATEGORIES.map((category) => ({
      category: category.name,
      href: new URL(`catalog/${category.slug}/`, SITE_BASE).pathname,
    }));
    assert.deepEqual(renderedCategories, expectedCategories);

    const filterStatus = openingTag('p', 'data-catalog-filter-status');
    assert.ok(filterStatus, 'catalog filter live region is missing');
    assert.equal(attribute(filterStatus, 'aria-live'), 'polite');
    assert.equal(attribute(filterStatus, 'aria-atomic'), 'true');

    const classNames = Array.from(catalogHtml.matchAll(/\bclass="([^"]*)"/g), (match) =>
      match[1].split(/\s+/),
    ).flat();
    assert.ok(!classNames.includes('catalog-rail'), 'legacy catalog-rail class remains');
    assert.ok(!classNames.includes('catalog-chips'), 'legacy catalog-chips class remains');
  });

  await t.test('every product page exists', async () => {
    for (const slug of slugs) {
      await access(path.join(distDir, 'products', slug, 'index.html'));
    }
  });

  await t.test('every category landing page exists', async () => {
    for (const { slug } of CATEGORIES) {
      await access(path.join(distDir, 'catalog', slug, 'index.html'));
    }
    await access(path.join(distDir, 'catalog', 'index.html'));
  });

  await t.test('the four sections contain every product exactly once', async () => {
    assert.equal(CATEGORIES.length, 4);
    const categorized = [];
    for (const category of CATEGORIES) {
      const html = await readFile(path.join(distDir, 'catalog', category.slug, 'index.html'), 'utf8');
      const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
      const list = graph.find((node) => node['@type'] === 'ItemList');
      const urls = list.itemListElement.map((entry) => entry.url);
      const expected = products
        .filter((product) => product.category === category.name)
        .map((product) => `${SITE_BASE}products/${product.slug}/`);
      assert.ok(expected.length > 0, `${category.name} is empty`);
      assert.deepEqual([...urls].sort(), [...expected].sort());
      for (const url of expected) {
        assert.ok(html.includes(`href="${new URL(url).pathname}"`), `${url} has no visible link`);
      }
      categorized.push(...urls);
    }
    assert.equal(new Set(categorized).size, 39);
    assert.equal(categorized.length, 39);
  });

  await t.test('retired category routes redirect without appearing in navigation', async () => {
    const home = await readFile(path.join(distDir, 'index.html'), 'utf8');
    const catalog = await readFile(path.join(distDir, 'catalog', 'index.html'), 'utf8');
    for (const [from, to] of Object.entries(CATEGORY_REDIRECTS)) {
      const html = await readFile(path.join(distDir, from.slice(1), 'index.html'), 'utf8');
      const destination = new URL(to.slice(1), SITE_BASE).pathname;
      assert.ok(html.includes(`<meta http-equiv="refresh" content="0;url=${destination}">`));
      assert.ok(html.includes('<meta name="robots" content="noindex">'));
      assert.ok(!home.includes(`href="${new URL(from.slice(1), SITE_BASE).pathname}"`));
      assert.ok(!catalog.includes(`href="${new URL(from.slice(1), SITE_BASE).pathname}"`));
    }
  });

  await t.test('every guide page exists', async () => {
    for (const { slug } of GUIDES) {
      await access(path.join(distDir, 'guides', slug, 'index.html'));
    }
  });

  await t.test('removed pages are absent from the build, links and structured data', async () => {
    const removedRoutes = ['guides/', 'about/'];
    for (const route of removedRoutes) {
      assert.ok(!STATIC_ROUTE_PATHS.includes(route), `${route} is still indexable`);
      await assert.rejects(access(path.join(distDir, route, 'index.html')), { code: 'ENOENT' });
    }

    const files = await readdir(distDir, { recursive: true });
    for (const file of files.filter((file) => file.endsWith('.html') || file === 'sitemap.xml')) {
      const content = await readFile(path.join(distDir, file), 'utf8');
      for (const route of removedRoutes) {
        const url = new URL(route, SITE_BASE);
        // Match the page URL and its anchors/query strings, while allowing
        // separate articles beneath /guides/ to keep their existing URLs.
        const escapedPath = url.pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reference = new RegExp(`${escapedPath}(?=["'<>?#\\s])`);
        assert.ok(!reference.test(content), `${file} still references ${route}`);
      }
    }
  });

  await t.test('sitemap lists exactly the indexable URLs', async () => {
    const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
    const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1]);

    const expected = [
      ...STATIC_ROUTE_PATHS.map((routePath) => `${SITE_BASE}${routePath}`),
      ...slugs.map((slug) => `${SITE_BASE}products/${slug}/`),
    ];

    assert.deepEqual(
      [...locs].sort(),
      [...expected].sort(),
      'sitemap does not match the set of indexable routes',
    );

    // Non-canonical and non-indexable URLs must never be listed.
    for (const forbidden of ['404', 'robots.txt', 'sitemap.xml', INDEXNOW_KEY]) {
      assert.ok(
        !locs.some((loc) => loc.includes(forbidden)),
        `sitemap must not list ${forbidden}`,
      );
    }
  });

  await t.test('crawler-facing files are published', async () => {
    const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8');
    assert.ok(
      robots.includes(`Sitemap: ${SITE_BASE}sitemap.xml`),
      'robots.txt must point at the sitemap',
    );
    const robotsLines = robots.split('\n').map((line) => line.trim());
    assert.ok(robotsLines.includes('Allow: /'), 'robots.txt must allow crawling');
    assert.ok(
      !robotsLines.some((line) => /^Disallow:\s*\/$/.test(line)),
      'robots.txt must not disallow the whole site',
    );

    // IndexNow proves ownership with a key file whose body is exactly the key.
    const keyFile = await readFile(path.join(distDir, `${INDEXNOW_KEY}.txt`), 'utf8');
    assert.equal(keyFile.trim(), INDEXNOW_KEY);
  });

  await t.test('hreflang alternates are reciprocal and self-referencing', async () => {
    const pages = {
      uk: await readFile(path.join(distDir, 'index.html'), 'utf8'),
      en: await readFile(path.join(distDir, 'en', 'index.html'), 'utf8'),
    };

    for (const [name, html] of Object.entries(pages)) {
      const alternates = Array.from(
        html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g),
        (m) => [m[1], m[2]],
      );
      assert.deepEqual(
        alternates,
        [
          ['uk', SITE_BASE],
          ['en', `${SITE_BASE}en/`],
          ['x-default', SITE_BASE],
        ],
        `${name} page publishes the wrong hreflang set`,
      );
    }

    assert.ok(pages.en.includes('<html lang="en">'), '/en/ must declare lang="en"');
    assert.ok(pages.uk.includes('<html lang="uk">'), 'home page must declare lang="uk"');
  });

  await t.test('product pages carry no inline event handlers', async () => {
    const catalogHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
    assert.ok(
      !/\son(?:error|click|load)\s*=/i.test(catalogHtml),
      'catalog page contains an inline event handler',
    );
  });

  await t.test('full artifact checks pass (scripts/check-build.mjs)', async () => {
    // Same checks as `npm run check:build`: metadata uniqueness, JSON-LD
    // validity and price/availability/FAQ consistency, internal links and
    // anchors, image fallback wiring, branding assets, URL schemes.
    const failures = await checkBuild();
    assert.deepEqual(failures, []);
  });
});
