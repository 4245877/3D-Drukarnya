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
import { GUIDES } from '../src/data/guides.mjs';
import { STATIC_ROUTE_PATHS } from '../src/data/routes.mjs';
import { INDEXNOW_KEY } from '../src/data/site.config.mjs';

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
    timeout: 10 * 60 * 1000,
  });

  const products = await loadProducts();
  const slugs = products.map(({ slug }) => slug);
  assert.equal(products.length, 38, 'production build must contain all 38 products');

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

  await t.test('every guide page exists', async () => {
    for (const { slug } of GUIDES) {
      await access(path.join(distDir, 'guides', slug, 'index.html'));
    }
    await access(path.join(distDir, 'guides', 'index.html'));
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
