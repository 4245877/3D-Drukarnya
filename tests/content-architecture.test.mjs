// Content-architecture tests: the category landing pages, the guides and the
// route table that ties them into the sitemap and the build checks.
//
// These run without a build — they guard the data layer that decides which
// pages exist, what they are called and how they link to each other.
// Runner: built-in node:test (`npm test`).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  resolveCategories,
  validateCategoryDefinitions,
} from '../src/data/categories.mjs';
import {
  GUIDES,
  GUIDE_BY_SLUG,
  resolveGuides,
  validateGuideDefinitions,
} from '../src/data/guides.mjs';
import { CATALOG_CATEGORIES, SLUG_PATTERN } from '../src/data/product.schema.mjs';
import { STATIC_ROUTES, STATIC_ROUTE_PATHS } from '../src/data/routes.mjs';

test('every catalog category has exactly one landing page', () => {
  assert.deepEqual(validateCategoryDefinitions(), []);
  assert.equal(CATEGORIES.length, CATALOG_CATEGORIES.length);
  assert.deepEqual(
    [...CATEGORIES.map((category) => category.name)].sort(),
    [...CATALOG_CATEGORIES].sort(),
  );
});

test('category slugs are URL-safe and unique', () => {
  const slugs = CATEGORIES.map((category) => category.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'category slugs must be unique');
  for (const slug of slugs) {
    assert.match(slug, SLUG_PATTERN, `"${slug}" is not a safe URL slug`);
  }
});

test('category metadata is complete and unique', () => {
  const titles = new Set();
  const descriptions = new Set();
  const headings = new Set();

  for (const category of CATEGORIES) {
    const where = `category "${category.slug}"`;

    assert.ok(category.title.length > 0, `${where} has no title`);
    assert.ok(category.heading.length > 0, `${where} has no heading`);
    assert.ok(category.lead.length > 80, `${where} has no substantial lead paragraph`);
    assert.ok(category.body.length > 0, `${where} has no body copy`);
    assert.ok(category.highlights.length > 0, `${where} has no highlights`);
    assert.ok(category.faq.length >= 2, `${where} needs at least two FAQ entries`);

    // Meta descriptions get clipped in results around ~160 characters, and an
    // empty one is worse than a short one.
    assert.ok(
      category.description.length >= 70 && category.description.length <= 200,
      `${where} description is ${category.description.length} chars, expected 70–200`,
    );

    assert.ok(!titles.has(category.title), `${where} reuses a title`);
    assert.ok(!descriptions.has(category.description), `${where} reuses a description`);
    assert.ok(!headings.has(category.heading), `${where} reuses a heading`);
    titles.add(category.title);
    descriptions.add(category.description);
    headings.add(category.heading);

    for (const item of category.faq) {
      assert.ok(item.question.trim().endsWith('?'), `${where}: "${item.question}" is not a question`);
      assert.ok(item.answer.length > 60, `${where}: answer to "${item.question}" is too thin`);
    }
  }
});

test('guide metadata is complete and unique', () => {
  assert.deepEqual(validateGuideDefinitions(), []);

  const slugs = GUIDES.map((guide) => guide.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'guide slugs must be unique');

  const titles = new Set();
  for (const guide of GUIDES) {
    const where = `guide "${guide.slug}"`;

    assert.match(guide.slug, SLUG_PATTERN, `${where} is not a safe URL slug`);
    assert.ok(!titles.has(guide.title), `${where} reuses a title`);
    titles.add(guide.title);

    // The summary is the "direct answer" block, the part most likely to be
    // quoted. It has to actually answer something.
    assert.ok(guide.summary.length > 120, `${where} has no substantial summary`);
    assert.ok(guide.topics.length > 0, `${where} declares no topics`);
    assert.ok(guide.faq.length >= 3, `${where} needs at least three FAQ entries`);
    assert.ok(
      guide.description.length >= 70 && guide.description.length <= 200,
      `${where} description is ${guide.description.length} chars, expected 70–200`,
    );
    assert.match(guide.datePublished, /^\d{4}-\d{2}-\d{2}$/, `${where} datePublished`);
    assert.match(guide.dateModified, /^\d{4}-\d{2}-\d{2}$/, `${where} dateModified`);
    assert.ok(
      guide.dateModified >= guide.datePublished,
      `${where} was modified before it was published`,
    );
  }
});

test('cross-link resolvers reject unknown slugs', () => {
  assert.throws(() => resolveCategories(['no-such-category']), /Unknown category slug/);
  assert.throws(() => resolveGuides(['no-such-guide']), /Unknown guide slug/);

  // …and return the real definitions for known ones.
  assert.equal(resolveCategories(['nas-cases'])[0], CATEGORY_BY_SLUG.get('nas-cases'));
  assert.equal(
    resolveGuides(['diy-nas-case-guide'])[0],
    GUIDE_BY_SLUG.get('diy-nas-case-guide'),
  );
});

test('static routes cover every landing page exactly once', () => {
  assert.equal(
    new Set(STATIC_ROUTE_PATHS).size,
    STATIC_ROUTE_PATHS.length,
    'route table contains duplicates',
  );

  // '' is the home page; every other route is a directory URL, matching
  // astro.config.mjs `trailingSlash: 'always'`.
  for (const routePath of STATIC_ROUTE_PATHS) {
    if (routePath === '') continue;
    assert.ok(routePath.endsWith('/'), `route "${routePath}" must end with a slash`);
    assert.ok(!routePath.startsWith('/'), `route "${routePath}" must not start with a slash`);
  }

  for (const category of CATEGORIES) {
    assert.ok(
      STATIC_ROUTE_PATHS.includes(`catalog/${category.slug}/`),
      `category "${category.slug}" is missing from the route table`,
    );
  }
  for (const guide of GUIDES) {
    assert.ok(
      STATIC_ROUTE_PATHS.includes(`guides/${guide.slug}/`),
      `guide "${guide.slug}" is missing from the route table`,
    );
  }
  for (const routePath of ['', 'catalog/', 'guides/', 'about/', 'en/']) {
    assert.ok(STATIC_ROUTE_PATHS.includes(routePath), `route "${routePath}" is missing`);
  }
});

test('only guides publish a lastmod, and it matches their dateModified', () => {
  for (const route of STATIC_ROUTES) {
    if (route.path.startsWith('guides/') && route.path !== 'guides/') {
      const slug = route.path.slice('guides/'.length, -1);
      assert.equal(
        route.lastmod,
        GUIDE_BY_SLUG.get(slug)?.dateModified,
        `lastmod for "${route.path}" does not match the guide`,
      );
    } else {
      // A sitemap where every URL shares one invented lastmod is worth less
      // than one with no lastmod at all, so pages without a real
      // modification date deliberately publish none.
      assert.equal(route.lastmod, undefined, `route "${route.path}" invents a lastmod`);
    }
  }
});
