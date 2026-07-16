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

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(projectRoot, 'dist');
const productsDir = path.join(projectRoot, 'src', 'data', 'products');
const astroBin = path.join(projectRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');

// Must mirror astro.config.mjs (site + base + trailingSlash: 'always').
const SITE_BASE = 'https://4245877.github.io/3D-Drukarnya/';

async function loadSlugs() {
  const fileNames = (await readdir(productsDir)).filter((name) =>
    name.endsWith('.json'),
  );

  return Promise.all(
    fileNames.map(async (fileName) => {
      const data = JSON.parse(
        await readFile(path.join(productsDir, fileName), 'utf8'),
      );
      return data.slug;
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

  const slugs = await loadSlugs();
  assert.ok(slugs.length > 0, 'expected at least one product');

  await t.test('catalog page exists', async () => {
    await access(path.join(distDir, 'index.html'));
  });

  await t.test('every product page exists', async () => {
    for (const slug of slugs) {
      await access(path.join(distDir, 'products', slug, 'index.html'));
    }
  });

  await t.test('sitemap contains the catalog and every product URL', async () => {
    const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8');

    assert.ok(
      sitemap.includes(`<loc>${SITE_BASE}</loc>`),
      'sitemap is missing the catalog URL',
    );

    for (const slug of slugs) {
      const url = `${SITE_BASE}products/${slug}/`;
      assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap is missing ${url}`);
    }

    const locCount = (sitemap.match(/<loc>/g) ?? []).length;
    assert.equal(
      locCount,
      slugs.length + 1,
      'sitemap contains unexpected extra URLs',
    );
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
